import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { PaymentEntity } from 'src/database/entities/payment.entity';
import { ApiResponse } from 'src/common/interfaces/res.interface';
import {
  PaymentResponseDto,
  PaymentStatusDto,
} from './dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repo: Repository<PaymentEntity>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create payment (SIMULATED - no real WeChat Pay integration)
   * In SIMULATED mode, the payment is auto-approved after creation
   */
  async createPayment(
    orderNo: string,
    userId: number,
    amount: number,
  ): Promise<ApiResponse> {
    try {
      // Generate payment_no: P + YYYYMMDD + random 8 chars
      const dateStr = dayjs().format('YYYYMMDD');
      const randomStr = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
      const paymentNo = `P${dateStr}${randomStr}`;

      // Generate mock prepay_id (simulating WeChat Pay)
      const prepayId = `wx${dayjs().format('YYYYMMDDHHmmss')}${uuidv4()
        .replace(/-/g, '')
        .substring(0, 10)}`;

      // Save payment record with status='pending'
      const payment = this.repo.create({
        payment_no: paymentNo,
        order_no: orderNo,
        user_id: userId,
        amount,
        status: 'pending',
        payment_method: 'wechat',
        pay_info: {
          prepay_id: prepayId,
          partnerid: this.configService.get<string>('WECHAT_MCH_ID') || 'simulation_mch_id',
          appid: this.configService.get<string>('WECHAT_APP_ID') || 'simulation_app_id',
          package: 'Sign=WXPay',
          noncestr: uuidv4().replace(/-/g, '').substring(0, 16),
          timestamp: Math.floor(Date.now() / 1000).toString(),
          sign: 'SIMULATED_SIGN_FOR_DEVELOPMENT',
        },
      });

      const saved = await this.repo.save(payment);

      // Auto-simulate success after 2 seconds (non-blocking)
      this.autoSimulateSuccess(paymentNo);

      const response: PaymentResponseDto = {
        payment_no: saved.payment_no,
        order_no: saved.order_no,
        amount: Number(saved.amount),
        status: saved.status,
        prepay_id: prepayId,
        payment_method: saved.payment_method,
        created_at: saved.created_at,
        is_simulated: true,
      };

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '支付订单创建成功',
        data: response,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Auto-simulate payment success after delay
   */
  private async autoSimulateSuccess(paymentNo: string): Promise<void> {
    // Simulate 2-second payment processing delay
    setTimeout(async () => {
      try {
        await this.simulatePaySuccess(paymentNo);
        console.log(`[Payment Simulation] Payment ${paymentNo} auto-approved`);
      } catch (error) {
        console.error(
          `[Payment Simulation] Auto-approve failed for ${paymentNo}:`,
          error.message,
        );
      }
    }, 2000);
  }

  /**
   * Simulate payment success
   */
  async simulatePaySuccess(paymentNo: string): Promise<ApiResponse> {
    try {
      const payment = await this.repo.findOne({
        where: { payment_no: paymentNo },
      });

      if (!payment) {
        throw new HttpException('支付订单不存在', HttpStatus.NOT_FOUND);
      }

      if (payment.status === 'success') {
        return {
          status: HttpStatus.OK,
          code: 1,
          message: '该支付已完成',
        };
      }

      // Generate mock transaction_id
      const transactionId = `mock${dayjs().format('YYYYMMDDHHmmss')}${uuidv4()
        .replace(/-/g, '')
        .substring(0, 8)}`;

      // Update payment status
      await this.repo.update(
        { payment_no: paymentNo },
        {
          status: 'success',
          transaction_id: transactionId,
          paid_at: new Date(),
          pay_info: {
            ...(typeof payment.pay_info === 'object' ? payment.pay_info : {}),
            transaction_id: transactionId,
            paid_at: new Date().toISOString(),
          },
        },
      );

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '支付成功',
        data: {
          payment_no: paymentNo,
          transaction_id: transactionId,
          status: 'success',
        },
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Query payment status by order_no
   */
  async queryPayment(orderNo: string): Promise<ApiResponse> {
    try {
      const payment = await this.repo.findOne({
        where: { order_no: orderNo },
      });

      if (!payment) {
        return {
          status: HttpStatus.OK,
          code: 1,
          message: '未找到该支付订单',
        };
      }

      const response: PaymentStatusDto = {
        payment_no: payment.payment_no,
        order_no: payment.order_no,
        amount: Number(payment.amount),
        status: payment.status,
        payment_method: payment.payment_method,
        transaction_id: payment.transaction_id,
        paid_at: payment.paid_at,
        created_at: payment.created_at,
      };

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '查询成功',
        data: response,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Handle payment callback (for when real WeChat Pay is integrated)
   */
  async handleNotify(payload: any): Promise<{ code: string; message: string }> {
    try {
      console.log('[Payment Notify] Received notification:', payload);

      // In simulation mode, just acknowledge
      return {
        code: 'SUCCESS',
        message: '通知处理成功',
      };
    } catch (error) {
      console.error('[Payment Notify] Error:', error.message);
      return {
        code: 'FAIL',
        message: error.message,
      };
    }
  }
}
