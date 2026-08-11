import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse } from 'src/common/interfaces/res.interface';
import { PaymentService } from './payment.service';
import {
  CreatePaymentDto,
  PaymentStatusQueryDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { ReqDto } from 'src/modules/token/dto/token.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Create payment (requires authentication)
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Request() req: ReqDto,
    @Body() body: CreatePaymentDto,
  ): Promise<ApiResponse> {
    const userId = body.user_id ?? req.user.id;
    return this.paymentService.createPayment(
      body.order_no,
      userId,
      body.amount,
    );
  }

  // Query payment status
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async queryPayment(
    @Query() query: PaymentStatusQueryDto,
  ): Promise<ApiResponse> {
    return this.paymentService.queryPayment(query.order_no);
  }

  // [DEV] Simulate payment success
  @Post('simulate/:paymentNo')
  @UseGuards(JwtAuthGuard)
  async simulatePaySuccess(
    @Param('paymentNo') paymentNo: string,
  ): Promise<ApiResponse> {
    return this.paymentService.simulatePaySuccess(paymentNo);
  }
}
