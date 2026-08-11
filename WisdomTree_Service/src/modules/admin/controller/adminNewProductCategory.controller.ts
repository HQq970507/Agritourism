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
import { AdminProductCategoryService } from '../service/adminProductCategory.service';
import {
  AdminProductCategoryListResDto,
  AdminProductCategoryActionResDto,
  AdminProductCategoryInfoResDto,
} from '../dto/adminProductCategoryRes.dto';
import {
  AdminAddProductCategoryDto,
  AdminDeleteProductCategoryDto,
  AdminGetProductCategoryInfoDto,
  AdminGetProductCategoryListDto,
  AdminUpdateProductCategoryDto,
} from '../dto/adminProductCategory.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminNewProductCategoryController {
  constructor(
    private readonly adminProductCategoryService: AdminProductCategoryService,
  ) {}

  // 管理员增加产品分类
  @Post('addProductCategory')
  async addCategory(
    @Body() body: AdminAddProductCategoryDto,
  ): Promise<AdminProductCategoryActionResDto> {
    return await this.adminProductCategoryService.addCategory(body);
  }

  // 管理员获取产品分类列表（分页）
  @Get('getProductCategoryList')
  async getCategoryList(
    @Query() query: AdminGetProductCategoryListDto,
  ): Promise<AdminProductCategoryListResDto> {
    return await this.adminProductCategoryService.getCategoryList(
      query.page,
      query.pageSize,
    );
  }

  // 管理员获取产品分类信息
  @Get('getProductCategoryInfo')
  async getCategoryInfo(
    @Query() query: AdminGetProductCategoryInfoDto,
  ): Promise<AdminProductCategoryInfoResDto> {
    return await this.adminProductCategoryService.getCategoryInfo(
      query.categoryId,
    );
  }

  // 管理员修改产品分类信息
  @Put('updateProductCategory')
  async updateCategory(
    @Body() body: AdminUpdateProductCategoryDto,
  ): Promise<AdminProductCategoryActionResDto> {
    return await this.adminProductCategoryService.updateCategory(body);
  }

  // 管理员删除产品分类
  @Delete('deleteProductCategory')
  async deleteCategory(
    @Query() query: AdminDeleteProductCategoryDto,
  ): Promise<AdminProductCategoryActionResDto> {
    return await this.adminProductCategoryService.deleteCategory(
      query.categoryId,
    );
  }
}
