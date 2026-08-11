import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductCategoryEntity } from 'src/database/entities/product_categories.entity';
import { Repository } from 'typeorm';
import {
  AdminProductCategoryListResDto,
  AdminProductCategoryActionResDto,
  AdminProductCategoryInfoResDto,
} from '../dto/adminProductCategoryRes.dto';
import {
  BadDifference,
} from '../exception/adminTree.exception';
import { ProductEntity } from 'src/database/entities/products.entity';
import { ProductMediaEntity } from 'src/database/entities/product_media.entity';
import { AdminProductService } from './adminProduct.service';

@Injectable()
export class AdminProductCategoryService {
  constructor(
    private readonly adminProductService: AdminProductService,
    @InjectRepository(ProductCategoryEntity)
    private readonly productCategoryRepository: Repository<ProductCategoryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductMediaEntity)
    private readonly productMediaRepository: Repository<ProductMediaEntity>,
  ) {}

  // 管理员创建产品分类
  async addCategory(
    categoryInfo: any,
  ): Promise<AdminProductCategoryActionResDto> {
    try {
      const newCategory = await this.productCategoryRepository.save({
        ...categoryInfo,
        remaining: categoryInfo.total,
      });

      await this.adminProductService.addProductsAndMedia(
        categoryInfo.total,
        newCategory.id,
      );

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '创建产品分类及其产品成功',
      };
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 1,
          message: '产品分类名称已存在',
        };
      }
      console.log(error);
      throw error;
    }
  }

  // 管理员获取产品分类列表（分页）
  async getCategoryList(
    page: number,
    pageSize: number,
  ): Promise<AdminProductCategoryListResDto> {
    try {
      const [categoryList, count]: Array<any> =
        await this.productCategoryRepository.findAndCount({
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

      categoryList.map((item: any) => {
        delete item.updated_at;
        delete item.created_at;
      });

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取产品分类列表成功',
        data: {
          page,
          pageSize,
          total: count,
          categoryList,
        },
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // 管理员修改产品分类信息
  async updateCategory(
    body: any,
  ): Promise<AdminProductCategoryActionResDto> {
    try {
      const { categoryId, ...remain } = body;

      const categoryInfo = await this.productCategoryRepository.findOne({
        where: { id: categoryId },
      });

      if (
        categoryInfo.total - categoryInfo.remaining !==
        remain.total - remain.remaining
      ) {
        throw new BadDifference();
      }

      if (remain.total > categoryInfo.total) {
        await this.adminProductService.addProductsAndMedia(
          remain.total - categoryInfo.total,
          categoryInfo.id,
        );
      } else if (remain.total < categoryInfo.total) {
        for (let i = 0; i < categoryInfo.total - remain.total; i++) {
          const product = await this.productRepository.findOne({
            where: {
              category: { id: categoryId },
              is_sold: false,
            },
          });

          await this.productMediaRepository.delete({
            product: { id: product.id },
          });

          await this.productRepository.delete({
            id: product.id,
            is_sold: false,
          });
        }
      }

      await this.productCategoryRepository.update(
        { id: categoryId },
        { ...remain },
      );

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '管理员修改产品分类信息成功',
      };
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 1,
          message: '产品分类名称已存在',
        };
      }
      console.log(error);
      throw error;
    }
  }

  // 管理员删除产品分类
  async deleteCategory(
    categoryId: number,
  ): Promise<AdminProductCategoryActionResDto> {
    try {
      const categoryInfo = await this.productCategoryRepository.findOne({
        where: { id: categoryId },
      });

      const productCount = categoryInfo.total === categoryInfo.remaining;

      if (!productCount) {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 1,
          message: '该分类下有已售出产品，无法删除',
        };
      }

      await this.productMediaRepository.delete({
        category: { id: categoryId },
      });

      await this.productRepository.delete({
        category: { id: categoryId },
      });

      await this.productCategoryRepository.delete({ id: categoryId });

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '删除产品分类及其产品成功',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // 管理员获取产品分类信息
  async getCategoryInfo(
    categoryId: number,
  ): Promise<AdminProductCategoryInfoResDto> {
    try {
      const categoryInfo = await this.productCategoryRepository.findOne({
        where: { id: categoryId },
      });

      delete categoryInfo.updated_at;
      delete categoryInfo.created_at;

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取产品分类信息成功',
        data: categoryInfo,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
