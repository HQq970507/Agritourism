import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import {
  GetOrderListRequestDto,
  GetOrderDetailRequestDto,
  UpdateOrderStatusRequestDto,
} from './dto/orderRequest.dto';
import {
  GetOrderListDto,
  GetOrderDetailDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import { AdminGuard } from '../admin/guard/admin.guard';

@Controller('order')
@UseGuards(AdminGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // 获取订单列表（分页）
  @Get('getOrderList')
  async getOrderList(
    @Query() query: GetOrderListDto,
  ): Promise<GetOrderListRequestDto> {
    return await this.orderService.getOrderList(query.page, query.pageSize);
  }

  // 获取订单详情
  @Get('getOrderDetail')
  async getOrderDetail(
    @Query() query: GetOrderDetailDto,
  ): Promise<GetOrderDetailRequestDto> {
    return await this.orderService.getOrderDetail(query.orderId);
  }

  // 更新订单状态
  @Put('updateOrderStatus')
  async updateOrderStatus(
    @Body() body: UpdateOrderStatusDto,
  ): Promise<UpdateOrderStatusRequestDto> {
    return await this.orderService.updateOrderStatus(
      body.orderId,
      body.status,
    );
  }
}
