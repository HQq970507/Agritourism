import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

// 创建支付请求
export class CreatePaymentDto {
  @IsNotEmpty()
  @IsString()
  order_no: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsNumber()
  user_id?: number;
}

// 支付状态查询参数
export class PaymentStatusQueryDto {
  @IsNotEmpty()
  @IsString()
  order_no: string;
}

// 支付响应
export class PaymentResponseDto {
  payment_no: string;
  order_no: string;
  amount: number;
  status: string;
  prepay_id: string;
  payment_method: string;
  created_at: Date;
  is_simulated: boolean;
}

// 支付状态响应
export class PaymentStatusDto {
  payment_no: string;
  order_no: string;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id: string;
  paid_at: Date;
  created_at: Date;
}
