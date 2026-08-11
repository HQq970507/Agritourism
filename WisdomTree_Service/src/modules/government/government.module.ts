import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from '../token/token.module';
import { GovernmentController } from './government.controller';
import { GovernmentService } from './government.service';
import { GovernmentGuard } from '../admin/guard/government.guard';

/**
 * 政府端模块（P4）
 *
 * 政府（admin_user 表 role='government'）登录后监管农户（审核/封禁）、
 * 产品（全区列表/下架）与区域报告（按市汇总 / 总览）。
 */
@Module({
  imports: [DatabaseModule, TokenModule],
  controllers: [GovernmentController],
  providers: [GovernmentService, GovernmentGuard],
})
export class GovernmentModule {}
