import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  GetProductListRequestDto,
  GetProductDetailRequestDto,
  CreateOrderRequestDto,
  GetUserOrdersRequestDto,
  GetUserOrderDetailRequestDto,
} from './dto/productRequest.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from 'src/database/entities/products.entity';
import { ProductMediaEntity } from 'src/database/entities/product_media.entity';
import { OrderEntity } from 'src/database/entities/orders.entity';
import { Repository, Like } from 'typeorm';
import { CreateOrderDto, PaginateQueryDto } from './dto/product.dto';
import {
  BadCreateOrderException,
  BadGetUserOrderDetailException,
  NoProductException,
  NoProductStockException,
} from './exception/product.exception';
import { ProductCategoryEntity } from 'src/database/entities/product_categories.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import dayjs from 'dayjs';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductMediaEntity)
    private readonly productMediaRepository: Repository<ProductMediaEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(ProductCategoryEntity)
    private readonly productCategoryRepository: Repository<ProductCategoryEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // 获取产品分类列表
  async getProductList(
    userId: number,
    query: PaginateQueryDto,
  ): Promise<GetProductListRequestDto> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      const { page, pageSize, keyword } = query;
      // keyword 支持逗号分隔多关键词（如 "枸杞,滩羊,葡萄酒"），任一匹配即命中
      const keywords = keyword
        ? keyword
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean)
        : [];
      const recordsQuery = this.productCategoryRepository.createQueryBuilder('c');
      if (keywords.length > 0) {
        recordsQuery.where('(1=0)');
        keywords.forEach((k, i) => {
          recordsQuery.orWhere(`c.display_name LIKE :kw${i}`, { [`kw${i}`]: `%${k}%` });
        });
      }
      const [records, total] = await recordsQuery
        .select([
          'c.id',
          'c.name',
          'c.display_name',
          'c.total',
          'c.remaining',
          'c.points_required',
          'c.price',
          'c.unit',
          'c.avatar',
        ])
        .orderBy('c.id', 'ASC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getManyAndCount();

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取成功',
        data: {
          userPoints: user?.energy ?? 0,
          total,
          page,
          pageSize,
          categories: records,
        },
      };
    } catch (error) {
      console.log(error);
      throw new NoProductException();
    }
  }

  // 获取某产品分类详情信息
  async getProductDetail(
    categoryId: number,
    userId: number,
  ): Promise<GetProductDetailRequestDto> {
    try {
      const user: UserEntity = await this.userRepository.findOne({
        where: { id: userId },
      });
      const category: ProductCategoryEntity = await this.productCategoryRepository.findOne({
        where: { id: categoryId },
      });
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取成功',
        data: {
          ...category,
          userPoints: user.energy,
        },
      };
    } catch (error) {
      console.log(error);
      throw new NoProductException();
    }
  }

  // 创建订单（下单）
  async createOrder(
    orderInfo: CreateOrderDto,
    userId: number,
  ): Promise<CreateOrderRequestDto> {
    const queryRunner =
      this.orderRepository.manager.connection.createQueryRunner();

    try {
      const [user, category] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId } }),
        this.productCategoryRepository.findOne({
          where: { id: orderInfo.categoryId },
        }),
      ]);

      // 积分校验
      if (user.energy < category.points_required * orderInfo.quantity) {
        throw new HttpException('积分不足，无法下单', HttpStatus.BAD_REQUEST);
      }

      await queryRunner.connect();
      await queryRunner.startTransaction();

      // 处理库存
      const orderStockInfo = await this.processOrderStock(orderInfo.categoryId, orderInfo.quantity);

      // 生成独特的订单编号
      const orderNo = await this.generateOrderNo(orderStockInfo);

      // 插入订单信息
      await this.orderRepository.insert({
        buyer_name: orderInfo.buyerName,
        product_name: orderInfo.productName,
        remark: orderInfo.remark,
        area: orderInfo.area,
        contact: orderInfo.contact,
        address: orderInfo.address,
        quantity: orderInfo.quantity,
        total_amount: category.price * orderInfo.quantity,
        order_no: orderNo,
        user: { id: userId },
        product: { id: orderStockInfo.productId },
        category: { id: orderInfo.categoryId },
      });

      // 扣除用户积分
      await this.userRepository.update(
        { id: userId },
        { energy: user.energy - category.points_required * orderInfo.quantity },
      );

      await queryRunner.commitTransaction();

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '下单成功',
        data: {
          orderNo,
          buyerName: orderInfo.buyerName,
          productName: orderInfo.productName,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) {
        throw error;
      }
      console.log(error);
      throw new BadCreateOrderException();
    } finally {
      await queryRunner.release();
    }
  }

  // 生成独特的订单编号
  async generateOrderNo(
    stockInfo: { total: number; remaining: number },
  ): Promise<string> {
    try {
      const now = dayjs();
      const datePart = now.format('YYYYMMDDHHmmss');
      const numPart = String(stockInfo.total - stockInfo.remaining);
      return datePart + numPart;
    } catch (error) {
      console.log(error);
      throw new NoProductException();
    }
  }

  // 处理订单库存
  async processOrderStock(
    categoryId: number,
    quantity: number,
  ): Promise<{ productId: number; total: number; remaining: number }> {
    const category: any = await this.productCategoryRepository.findOne({
      where: { id: categoryId },
    });

    if (category.remaining < quantity) {
      throw new NoProductStockException();
    }

    // 找到可售产品并标记为已售
    const availableProducts = await this.productRepository.find({
      where: {
        category: { id: categoryId },
        is_sold: false,
      },
      take: quantity,
    });

    if (availableProducts.length < quantity) {
      throw new NoProductStockException();
    }

    for (const product of availableProducts) {
      await this.productRepository.update(
        { id: product.id },
        { is_sold: true },
      );
    }

    category.remaining -= quantity;
    await this.productCategoryRepository.update(
      { id: categoryId },
      { remaining: category.remaining },
    );

    return {
      productId: availableProducts[0].id,
      total: category.total,
      remaining: category.remaining,
    };
  }

  // 获取用户订单列表
  async getUserOrders(userId: number): Promise<GetUserOrdersRequestDto> {
    const orders: any = await this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['product', 'product.category'],
    });

    const data = orders.map((item: any) => {
      const { id, product_name } = item;
      const category = item.product?.category;
      return {
        id,
        product_name,
        avatar: category?.avatar ?? '',
        name: category?.name ?? '',
      };
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data,
    };
  }

  // 获取用户订单详情
  async getUserOrderDetail(
    id: number,
  ): Promise<GetUserOrderDetailRequestDto> {
    try {
      const order: any = await this.orderRepository.findOne({
        where: { id },
        relations: ['product', 'product.category'],
      });

      const mediaFiles = await this.productMediaRepository.find({
        where: { product: { id: order.product.id } },
      });

      delete order.updated_at;
      const categoryInfo = order.product.category;
      if (categoryInfo) {
        delete categoryInfo.created_at;
        delete categoryInfo.updated_at;
      }
      delete order.product;

      const data = {
        ...order,
        ...categoryInfo,
        mediaUrl: mediaFiles.map((item) => item.media_url),
      };

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取成功',
        data,
      };
    } catch (error) {
      console.log(error);
      throw new BadGetUserOrderDetailException();
    }
  }
}
