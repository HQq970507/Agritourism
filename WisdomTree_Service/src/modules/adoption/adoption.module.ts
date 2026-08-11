import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from '../token/token.module';
import { ContractModule } from '../contract/contract.module';
import { TraceabilityModule } from '../traceability/traceability.module';
import { PointsModule } from '../points/points.module';
import { AdoptionController } from './adoption.controller';
import { AdoptionService } from './adoption.service';

/**
 * 产品认领模块（P0）
 *
 * 用户端认领下单：联动生成认养合约 + 溯源台账 + 积分奖励 + 日记初始化，
 * 并提供认领列表/详情与生长日记接口。
 */
@Module({
  imports: [
    DatabaseModule,
    TokenModule,
    ContractModule,
    TraceabilityModule,
    PointsModule,
  ],
  controllers: [AdoptionController],
  providers: [AdoptionService],
})
export class AdoptionModule {}
