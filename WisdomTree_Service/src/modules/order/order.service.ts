import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from 'src/database/entities/orders.entity';
import { Repository } from 'typeorm';
import {
  GetOrderListRequestDto,
  GetOrderDetailRequestDto,
  UpdateOrderStatusRequestDto,
} from './dto/orderRequest.dto';
import { BadGetOrderException } from './exception/order.exception';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  // 获取订单列表（分页）
  async getOrderList(
    page: number,
    pageSize: number,
    userId?: number,
  ): Promise<GetOrderListRequestDto> {
    try {
      const where: any = {};
      if (userId) {
        where.user = { id: userId };
      }

      const [orders, total] = await this.orderRepository.findAndCount({
        where,
        relations: ['user', 'product'],
        order: { ordered_at: 'DESC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      const data = orders.map((item: any) => ({
        id: item.id,
        order_no: item.order_no,
        buyer_name: item.buyer_name,
        product_name: item.product_name,
        quantity: item.quantity,
        total_amount: item.total_amount,
        status: item.status,
        ordered_at: item.ordered_at,
        username: item.user?.username,
      }));

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取订单列表成功',
        data: {
          page,
          pageSize,
          total,
          orders: data,
        },
      };
    } catch (error) {
      console.log(error);
      throw new BadGetOrderException();
    }
  }

  // 获取订单详情
  async getOrderDetail(orderId: number): Promise<GetOrderDetailRequestDto> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['user', 'product', 'category'],
      });

      if (!order) {
        throw new BadGetOrderException();
      }

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '获取订单详情成功',
        data: {
          id: order.id,
          order_no: order.order_no,
          buyer_name: order.buyer_name,
          contact: order.contact,
          address: order.address,
          area: order.area,
          product_name: order.product_name,
          quantity: order.quantity,
          total_amount: order.total_amount,
          status: order.status,
          remark: order.remark,
          ordered_at: order.ordered_at,
          username: order.user?.username,
        },
      };
    } catch (error) {
      console.log(error);
      throw new BadGetOrderException();
    }
  }

  // 更新订单状态
  async updateOrderStatus(
    orderId: number,
    status: string,
  ): Promise<UpdateOrderStatusRequestDto> {
    try {
      await this.orderRepository.update({ id: orderId }, { status });

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '更新订单状态成功',
      };
    } catch (error) {
      console.log(error);
      throw new BadGetOrderException();
    }
  }
}
