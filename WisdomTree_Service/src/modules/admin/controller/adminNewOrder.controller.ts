import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../guard/admin.guard';
import { AdminOrderService } from '../service/adminOrder.service';
import {
  AdminGetOrderResDto,
  AdminGetOrderDetailResDto,
  AdminOrderActionResDto,
} from '../dto/adminOrderRes.dto';
import {
  AdminGetOrderListDto,
  AdminGetOrderDetailDto,
  AdminUpdateOrderDto,
  AdminDeleteOrderDto,
} from '../dto/adminOrder.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminNewOrderController {
  constructor(private readonly adminOrderService: AdminOrderService) {}

  // 管理员获取订单列表（分页）
  @Get('getNewOrderList')
  async getOrderList(
    @Query() query: AdminGetOrderListDto,
  ): Promise<AdminGetOrderResDto> {
    return await this.adminOrderService.getOrderList(
      query.page,
      query.pageSize,
    );
  }

  // 管理员获取某订单详情
  @Get('getNewOrderDetail')
  async getOrderDetail(
    @Query() query: AdminGetOrderDetailDto,
  ): Promise<AdminGetOrderDetailResDto> {
    return await this.adminOrderService.getOrderDetail(query.orderId);
  }

  // 管理员修改订单信息
  @Put('updateNewOrder')
  async updateOrder(
    @Body() body: AdminUpdateOrderDto,
  ): Promise<AdminOrderActionResDto> {
    return await this.adminOrderService.updateOrder(body);
  }

  // 管理员删除订单
  @Delete('deleteNewOrder')
  async deleteOrder(
    @Query() query: AdminDeleteOrderDto,
  ): Promise<AdminOrderActionResDto> {
    return await this.adminOrderService.deleteOrder(query.orderId);
  }
}
