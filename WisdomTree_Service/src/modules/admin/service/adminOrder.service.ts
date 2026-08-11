import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from 'src/database/entities/orders.entity';
import { Repository } from 'typeorm';
import {
  AdminGetOrderResDto,
  AdminGetOrderDetailResDto,
  AdminOrderActionResDto,
} from '../dto/adminOrderRes.dto';
import { UserEntity } from 'src/database/entities/user.entity';
import { ProductCategoryEntity } from 'src/database/entities/product_categories.entity';
import { ProductEntity } from 'src/database/entities/products.entity';

@Injectable()
export class AdminOrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ProductCategoryEntity)
    private readonly productCategoryRepository: Repository<ProductCategoryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  // 管理员获取订单列表（分页）
  async getOrderList(
    page: number,
    pageSize: number,
  ): Promise<AdminGetOrderResDto> {
    try {
      const [orderList, total] =
        (await this.orderRepository.findAndCount({
          relations: ['user', 'product', 'product.category'],
          skip: (page - 1) * pageSize,
          take: pageSize,
          order: { ordered_at: 'DESC' },
        })) as [OrderEntity[], number];

      const data = orderList.map((item: any) => {
        const { username } = item.user;
        const { id, order_no, buyer_name, product_name, quantity, total_amount, status, ordered_at } = item;

        return {
          id,
          orderNo: order_no,
          buyerName: buyer_name,
          productName: product_name,
          quantity,
          totalAmount: total_amount,
          status,
          orderedAt: ordered_at,
          username,
        };
      });

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '管理员获取订单列表成功',
        data: {
          page,
          pageSize,
          total,
          orderList: data,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // 管理员获取订单详情
  async getOrderDetail(orderId: number): Promise<AdminGetOrderDetailResDto> {
    try {
      const data: any = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['user', 'product', 'product.category'],
      });

      const { username } = data.user;
      const { id, order_no, buyer_name, contact, address, area, product_name, quantity, total_amount, status, remark } = data;

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '管理员获取订单详情成功',
        data: {
          id,
          orderNo: order_no,
          buyerName: buyer_name,
          contact,
          address,
          area,
          productName: product_name,
          quantity,
          totalAmount: total_amount,
          status,
          remark,
          username,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // 管理员修改订单信息
  async updateOrder(body: any): Promise<AdminOrderActionResDto> {
    try {
      const { orderId, buyerName, contact, address, area, productName, status, remark } = body;

      await this.orderRepository.update(
        { id: orderId },
        {
          buyer_name: buyerName,
          contact,
          address,
          area,
          product_name: productName,
          status,
          remark,
        },
      );

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '管理员更新订单成功',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // 管理员删除订单
  async deleteOrder(orderId: number): Promise<AdminOrderActionResDto> {
    try {
      await this.orderRepository.delete({ id: orderId });

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '管理员删除订单成功',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
