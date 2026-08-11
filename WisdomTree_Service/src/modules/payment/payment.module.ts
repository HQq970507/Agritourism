import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from 'src/modules/token/token.module';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from 'src/common/guards/token.guard';

@Module({
  imports: [DatabaseModule, TokenModule, ConfigModule],
  controllers: [PaymentController],
  providers: [JwtAuthGuard, PaymentService],
})
export class PaymentModule {}
