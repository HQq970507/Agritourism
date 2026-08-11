import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  GetProductListRequestDto,
  GetProductDetailRequestDto,
  CreateOrderRequestDto,
  GetUserOrdersRequestDto,
  GetUserOrderDetailRequestDto,
} from './dto/productRequest.dto';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { ProductService } from './product.service';
import {
  CreateOrderDto,
  GetProductDetailDto,
  GetCategoryDetailDto,
  PaginateQueryDto,
} from './dto/product.dto';
import { ReqDto } from '../token/dto/token.dto';
import { ApiResponse } from 'src/common/interfaces/res.interface';

@Controller('product')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // 获取产品分类列表
  @Get('getProductList')
  async getProductList(
    @Request() req: ReqDto,
    @Query() query: PaginateQueryDto,
  ): Promise<GetProductListRequestDto> {
    return await this.productService.getProductList(req.user.id, query);
  }

  // 获取某产品分类详情信息
  @Get('getProductDetail')
  async getProductDetail(
    @Query() query: GetCategoryDetailDto,
    @Request() req: ReqDto,
  ): Promise<GetProductDetailRequestDto> {
    return await this.productService.getProductDetail(query.categoryId, req.user.id);
  }

  // 创建订单
  @Post('createOrder')
  async createOrder(
    @Body() body: CreateOrderDto,
    @Request() req: ReqDto,
  ): Promise<CreateOrderRequestDto> {
    return await this.productService.createOrder(body, req.user.id);
  }

  // 获取用户订单列表
  @Get('getUserOrders')
  async getUserOrders(@Request() req: any): Promise<ApiResponse> {
    return await this.productService.getUserOrders(req.user.id);
  }

  // 获取用户订单详情
  @Get('getUserOrderDetail')
  async getUserOrderDetail(
    @Query() query: GetProductDetailDto,
  ): Promise<GetUserOrderDetailRequestDto> {
    return await this.productService.getUserOrderDetail(query.orderId);
  }
}
