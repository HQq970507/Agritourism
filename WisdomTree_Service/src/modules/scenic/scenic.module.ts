import { Module, OnModuleInit } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from '../token/token.module';
import { HttpModule } from '@nestjs/axios';
import { ScenicController } from './scenic.controller';
import { ScenicService } from './scenic.service';
import { ScenicSyncService } from './scenic-sync.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScenicSpotEntity } from 'src/database/entities/scenic_spots.entity';
import { seedScenicSpots } from './seed';

/**
 * 文旅景区模块
 *
 * 负责宁夏文旅部认证的 5A 级旅游景区、国家级旅游度假区等名录展示。
 * 启动时先插入种子数据（幂等），再由 ScenicSyncService 从文旅部
 * 官方 API 动态同步最新数据（含实时天气）。
 */
@Module({
  imports: [DatabaseModule, TokenModule, HttpModule],
  controllers: [ScenicController],
  providers: [ScenicService, ScenicSyncService],
  exports: [ScenicService],
})
export class ScenicModule implements OnModuleInit {
  constructor(
    @InjectRepository(ScenicSpotEntity)
    private readonly scenicRepo: Repository<ScenicSpotEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await seedScenicSpots(this.scenicRepo);
  }
}
