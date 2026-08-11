import { Module, OnModuleInit } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from '../token/token.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { JwtAuthGuard } from 'src/common/guards/token.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrowthDiaryEntity } from 'src/database/entities/growth_diary.entity';
import { LivestreamEntity } from 'src/database/entities/livestream.entity';
import { seedMediaData } from './seed';

/**
 * 媒体模块
 *
 * 负责认养产品的生长日记（生长时间线）与农场慢直播频道功能。
 * 模块初始化时自动插入演示种子数据（幂等）。
 */
@Module({
  imports: [DatabaseModule, TokenModule],
  controllers: [MediaController],
  providers: [JwtAuthGuard, MediaService],
  exports: [MediaService],
})
export class MediaModule implements OnModuleInit {
  constructor(
    @InjectRepository(GrowthDiaryEntity)
    private readonly diaryRepo: Repository<GrowthDiaryEntity>,
    @InjectRepository(LivestreamEntity)
    private readonly streamRepo: Repository<LivestreamEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await seedMediaData(this.diaryRepo, this.streamRepo);
  }
}
