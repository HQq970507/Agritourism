import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from '../token/token.module';
import { FarmerController } from './farmer.controller';
import { FarmerService } from './farmer.service';
import { FarmerGuard } from '../admin/guard/farmer.guard';

/**
 * 农户端模块（P3）
 *
 * 农户（admin_user 表 role='farmer'）入驻后，通过 farmer_id 归属
 * product_categories / products，管理名下认领订单、查看收益与数据看板。
 */
@Module({
  imports: [DatabaseModule, TokenModule],
  controllers: [FarmerController],
  providers: [FarmerService, FarmerGuard],
})
export class FarmerModule {}
