import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from '../token/token.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

/**
 * 订单模块
 *
 * 该模块负责订单管理相关功能。
 * 控制器处理HTTP请求，而服务则提供业务逻辑。
 */

@Module({
  imports: [DatabaseModule, TokenModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
