import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from 'src/modules/token/token.module';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';

/**
 * 自动化任务模块
 *
 * 提供自动化任务的编排能力：用户创建定时/循环任务，
 * 后台调度器（每 30 秒）检查到期任务并执行、记录日志。
 */
@Module({
  imports: [DatabaseModule, TokenModule],
  controllers: [AutomationController],
  providers: [JwtAuthGuard, AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
