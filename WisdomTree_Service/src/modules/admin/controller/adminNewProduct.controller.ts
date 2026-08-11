import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../guard/admin.guard';
import { AdminProductService } from '../service/adminProduct.service';
import {
  AdminGetProductResDto,
  AdminProductActionResDto,
} from '../dto/adminProductRes.dto';
import {
  AdminCreateProductDto,
  AdminGetProductListDto,
  AdminGetProductDetailDto,
  AdminUpdateProductDto,
  AdminDeleteProductDto,
} from '../dto/adminProduct.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminNewProductController {
  constructor(private readonly adminProductService: AdminProductService) {}

  // 管理员创建产品
  @Post('addProduct')
  async addProduct(
    @Body() body: AdminCreateProductDto,
  ): Promise<AdminProductActionResDto> {
    return await this.adminProductService.addProducts(
      body.categoryName,
      body.mediaUrls,
      body.price,
      body.unit,
    );
  }

  // 管理员获取产品列表（分页）
  @Get('getProductList')
  async getProductList(
    @Query() query: AdminGetProductListDto,
  ): Promise<AdminGetProductResDto> {
    return await this.adminProductService.getProductList(
      query.page,
      query.pageSize,
    );
  }

  // 管理员获取某产品详情
  @Get('getProductDetail')
  async getProductDetail(
    @Query() query: AdminGetProductDetailDto,
  ): Promise<any> {
    return await this.adminProductService.getProductDetail(query.productId);
  }

  // 管理员修改产品
  @Put('updateProduct')
  async updateProduct(
    @Body() body: AdminUpdateProductDto,
  ): Promise<any> {
    return await this.adminProductService.updateProduct(
      body.productId,
      body.categoryName,
      body.mediaUrls,
      body.price,
      body.unit,
    );
  }

  // 管理员删除产品
  @Delete('deleteProduct')
  async deleteProduct(
    @Query() query: AdminDeleteProductDto,
  ): Promise<any> {
    return await this.adminProductService.deleteProduct(query.productId);
  }

  // 管理员批量更新产品
  @Put('batchUpdateProducts')
  async batchUpdateProducts(
    @Body() body: any,
  ): Promise<any> {
    return await this.adminProductService.batchUpdateProducts(
      body.productIds,
      {
        price: body.price,
        unit: body.unit,
        is_sold: body.is_sold,
      },
    );
  }

  // 管理员批量删除产品
  @Delete('batchDeleteProducts')
  async batchDeleteProducts(
    @Query() query: any,
  ): Promise<any> {
    const productIds = Array.isArray(query.productIds)
      ? query.productIds.map(Number)
      : String(query.productIds || '')
          .split(',')
          .filter(Boolean)
          .map(Number);
    return await this.adminProductService.batchDeleteProducts(productIds);
  }
}
