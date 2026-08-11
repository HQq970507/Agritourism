import { HttpStatus, Injectable } from '@nestjs/common';
import {
  AdminGetProductResDto,
  AdminProductActionResDto,
} from '../dto/adminProductRes.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductMediaEntity } from 'src/database/entities/product_media.entity';
import { ProductCategoryEntity } from 'src/database/entities/product_categories.entity';
import { ProductEntity } from 'src/database/entities/products.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminProductService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductMediaEntity)
    private readonly productMediaRepository: Repository<ProductMediaEntity>,
    @InjectRepository(ProductCategoryEntity)
    private readonly productCategoryRepository: Repository<ProductCategoryEntity>,
  ) {}

  // 管理员创建产品
  async addProducts(
    categoryName: string,
    mediaUrls: Array<string>,
    price?: number,
    unit?: string,
  ): Promise<AdminProductActionResDto> {
    try {
      const categoryInfo: any = await this.productCategoryRepository.findOne({
        where: { name: categoryName },
      });

      if (!categoryInfo) {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 1,
          message: '产品分类不存在',
        };
      }

      const product: any = await this.productRepository.save({
        category: { id: categoryInfo.id },
        price: price ?? 0,
        unit: unit ?? null,
      });

      await this.productMediaRepository.insert(
        mediaUrls.map((item: string) => ({
          media_url: item,
          product: { id: product.id },
          category: { id: categoryInfo.id },
        })),
      );

      await this.productCategoryRepository.update(
        { id: categoryInfo.id },
        {
          total: () => 'total + 1',
          remaining: () => 'remaining + 1',
        },
      );

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '创建产品成功',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // 管理员获取产品列表（分页，按分类聚合：一个分类一行）
  async getProductList(
    page: number,
    pageSize: number,
  ): Promise<AdminGetProductResDto> {
    try {
      const [categoryList, total] =
        await this.productCategoryRepository.findAndCount({
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

      const data = categoryList.map((category: any) => {
        const { id, avatar, name, display_name, total, remaining, price, unit } =
          category;
        return {
          id,
          categoryName: name,
          displayName: display_name,
          is_sold: remaining > 0,
          price,
          unit,
          total,
          remaining,
          mediaUrls: avatar ? [avatar] : [],
        };
      });

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取产品列表成功',
        data: {
          page,
          pageSize,
          total,
          productList: data,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // 管理员获取某产品详情
  async getProductDetail(productId: number): Promise<any> {
    try {
      const product: ProductEntity = await this.productRepository.findOne({
        relations: ['category'],
        where: { id: productId },
      });
      const mediaFiles: Array<ProductMediaEntity> =
        await this.productMediaRepository.find({
          where: { product: { id: productId } },
        });
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取产品详情成功',
        data: {
          categoryName: product.category?.name ?? '',
          mediaUrls: mediaFiles.map((item: any) => item.media_url),
          price: product.price,
          unit: product.unit,
          is_sold: product.is_sold,
        },
      };
    } catch (error) {
      console.log(error);
    }
  }

  // 管理员修改产品
  async updateProduct(
    productId: number,
    categoryName: string,
    mediaUrls: Array<string>,
    price?: number,
    unit?: string,
  ): Promise<any> {
    try {
      const oldProduct: ProductEntity = await this.productRepository.findOne({
        where: { id: productId },
        relations: ['category'],
      });

      let newCategoryId = oldProduct.category?.id;

      if (categoryName !== oldProduct.category?.name) {
        await this.productCategoryRepository.update(
          { id: oldProduct.category?.id },
          {
            total: () => 'total - 1',
            remaining: () => 'remaining - 1',
          },
        );

        const nowCategory: ProductCategoryEntity =
          await this.productCategoryRepository.findOne({
            where: { name: categoryName },
          });

        if (!nowCategory) {
          return {
            status: HttpStatus.BAD_REQUEST,
            code: 1,
            message: '产品分类不存在',
          };
        }

        await this.productCategoryRepository.update(
          { id: nowCategory.id },
          {
            total: () => 'total + 1',
            remaining: () => 'remaining + 1',
          },
        );

        await this.productRepository.update(
          { id: productId },
          { category: { id: nowCategory.id } },
        );

        newCategoryId = nowCategory.id;
      }

      // 更新价格和单位
      if (price !== undefined || unit !== undefined) {
        const updateData: any = {};
        if (price !== undefined) updateData.price = price;
        if (unit !== undefined) updateData.unit = unit;
        await this.productRepository.update({ id: productId }, updateData);
      }

      // 更新媒体文件
      await this.productMediaRepository.delete({ product: { id: productId } });

      const newMedia = mediaUrls.map((item: string) => ({
        media_url: item,
        product: { id: productId },
        category: { id: newCategoryId },
      }));

      await this.productMediaRepository.insert(newMedia);

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '管理员修改产品成功',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // 管理员批量更新产品（分类级：改分类价格/单位）
  async batchUpdateProducts(
    productIds: number[],
    updateInfo: { price?: number; unit?: string; is_sold?: boolean },
  ): Promise<any> {
    try {
      if (!productIds || productIds.length === 0) {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 1,
          message: '请选择要操作的产品',
        };
      }

      const updateData: any = {};
      if (updateInfo.price !== undefined) updateData.price = updateInfo.price;
      if (updateInfo.unit !== undefined) updateData.unit = updateInfo.unit;

      if (Object.keys(updateData).length === 0) {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 1,
          message: '没有需要更新的字段',
        };
      }

      // 聚合视图下 productIds 即分类ID，更新分类价格/单位
      await this.productCategoryRepository.update(
        productIds.map((id) => ({ id })),
        updateData,
      );

      // 同步更新该分类下所有产品的价格/单位，保持数据一致
      for (const categoryId of productIds) {
        await this.productRepository.update(
          { category: { id: categoryId } },
          updateData,
        );
      }

      return {
        status: HttpStatus.OK,
        code: 0,
        message: `批量更新 ${productIds.length} 个产品成功`,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // 管理员批量删除产品（分类级：删除整个分类及其产品实例）
  async batchDeleteProducts(productIds: number[]): Promise<any> {
    try {
      if (!productIds || productIds.length === 0) {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 1,
          message: '请选择要删除的产品',
        };
      }

      // 检查分类下是否有已售出产品，有则不允许删除
      const soldCount = await this.productRepository.count({
        where: productIds.map((id) => ({
          category: { id },
          is_sold: true,
        })),
      });
      if (soldCount > 0) {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 1,
          message: `有 ${soldCount} 个产品已售出，无法删除，请先处理相关订单`,
        };
      }

      for (const categoryId of productIds) {
        const products: any[] = await this.productRepository.find({
          where: { category: { id: categoryId } },
        });
        for (const product of products) {
          await this.productMediaRepository.delete({
            product: { id: product.id },
          });
        }
        await this.productRepository.delete({ category: { id: categoryId } });
        await this.productCategoryRepository.delete({ id: categoryId });
      }

      return {
        status: HttpStatus.OK,
        code: 0,
        message: `批量删除 ${productIds.length} 个产品成功`,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // 管理员删除产品
  async deleteProduct(productId: number): Promise<any> {    try {
      const product: any = await this.productRepository.findOne({
        relations: ['category'],
        where: { id: productId },
      });

      if (product.is_sold) {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 1,
          message: '该产品已售出，无法删除',
        };
      }

      await this.productMediaRepository.delete({ product: { id: productId } });
      await this.productRepository.delete({ id: productId });

      await this.productCategoryRepository.update(
        { id: product.category.id },
        {
          total: () => 'total - 1',
          remaining: () => 'remaining - 1',
        },
      );

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '管理员删除产品成功',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // 批量添加产品和媒体
  async addProductsAndMedia(
    differenceNum: number,
    categoryId: number,
  ): Promise<void> {
    const productsToInsert: Array<any> = [];
    for (let i = 0; i < differenceNum; i++) {
      productsToInsert.push({
        category: { id: categoryId },
      });
    }
    const products: Array<any> = await this.productRepository.save(
      productsToInsert,
    );

    const allProductIds: Array<number> = products.map((item) => item.id);

    const mediaToInsert: Array<any> = [];
    for (let i = 0; i < differenceNum; i++) {
      mediaToInsert.push({
        product: { id: allProductIds[i] },
        media_url: this.configService.get<string>('DEFAULT_TREE_IMG'),
        category: { id: categoryId },
      });
    }

    await this.productMediaRepository.insert(mediaToInsert);
  }
}
