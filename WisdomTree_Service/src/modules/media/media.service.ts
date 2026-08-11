import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrowthDiaryEntity } from 'src/database/entities/growth_diary.entity';
import { LivestreamEntity } from 'src/database/entities/livestream.entity';
import { ApiResponse } from 'src/common/interfaces/res.interface';

@Injectable()
export class MediaService {
  /**
   * 生长阶段顺序（用于自动推进生长日记）
   */
  private readonly STAGES = [
    'seedling',
    'growing',
    'flowering',
    'fruiting',
    'harvest',
  ];

  /**
   * 各阶段AI风格描述（规则式演示，无需LLM）
   */
  private readonly STAGE_DESCRIPTIONS: Record<string, string> = {
    seedling: '幼苗破土而出，生机盎然',
    growing: '植株茁壮成长，叶片翠绿',
    flowering: '花蕾绽放，即将结果',
    fruiting: '果实逐渐饱满，色泽诱人',
    harvest: '迎来丰收时刻！',
  };

  constructor(
    @InjectRepository(GrowthDiaryEntity)
    private readonly diaryRepo: Repository<GrowthDiaryEntity>,
    @InjectRepository(LivestreamEntity)
    private readonly streamRepo: Repository<LivestreamEntity>,
  ) {}

  /**
   * 获取生长日记列表（时间线）
   * 可按产品名称筛选，按 created_at 倒序排列。
   */
  async getDiary(productName?: string): Promise<ApiResponse<GrowthDiaryEntity[]>> {
    const where = productName ? { product_name: productName } : {};

    const diaries = await this.diaryRepo.find({
      where,
      order: { created_at: 'DESC' },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: diaries,
    };
  }

  /**
   * 自动生成一条生长日记
   * 规则式生成（无LLM依赖）：
   * 1. 查找该产品最后一条日记 -> 推进到下一生长阶段，day_count + 1
   * 2. 生成对应阶段描述
   * 3. 随机温度(18-28°C)与湿度(55-75%)
   */
  async generateDiaryEntry(
    productName: string,
  ): Promise<ApiResponse<GrowthDiaryEntity>> {
    if (!productName || !productName.trim()) {
      throw new HttpException('产品名称不能为空', HttpStatus.BAD_REQUEST);
    }

    // 查找该产品最后一条日记（按认养天数倒序）
    const lastEntry = await this.diaryRepo.findOne({
      where: { product_name: productName },
      order: { day_count: 'DESC', id: 'DESC' },
    });

    let stage: string;
    let dayCount: number;

    if (!lastEntry) {
      // 无历史记录：从幼苗开始
      stage = this.STAGES[0];
      dayCount = 1;
    } else {
      // 推进到下一阶段；已是最后阶段则进入新一轮生长周期
      const currentIndex = this.STAGES.indexOf(lastEntry.stage);
      const nextIndex =
        currentIndex >= 0 && currentIndex < this.STAGES.length - 1
          ? currentIndex + 1
          : 0;
      stage = this.STAGES[nextIndex];
      dayCount = lastEntry.day_count + 1;
    }

    // 规则式描述
    const description = `${productName}${this.STAGE_DESCRIPTIONS[stage]}`;

    // 随机环境数据（温度范围 18-28°C，湿度 55-75%）
    const tempMin = 18 + Math.floor(Math.random() * 6);
    const tempMax = tempMin + 2 + Math.floor(Math.random() * (27 - tempMin));
    const temperature = `${tempMin}-${tempMax}°C`;
    const humidity = `${55 + Math.floor(Math.random() * 21)}%`;

    const diary = this.diaryRepo.create({
      product_name: productName,
      stage,
      day_count: dayCount,
      description,
      temperature,
      humidity,
    });
    const saved = await this.diaryRepo.save(diary);

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '生长日记生成成功',
      data: saved,
    };
  }

  /**
   * 获取慢直播频道列表
   */
  async getStreams(): Promise<ApiResponse<LivestreamEntity[]>> {
    const streams = await this.streamRepo.find({
      order: { id: 'ASC' },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: streams,
    };
  }

  /**
   * 切换慢直播频道开播状态（管理端演示）
   */
  async toggleStream(id: number): Promise<ApiResponse<LivestreamEntity>> {
    const stream = await this.streamRepo.findOne({ where: { id } });

    if (!stream) {
      throw new HttpException('直播频道不存在', HttpStatus.NOT_FOUND);
    }

    stream.is_live = !stream.is_live;
    const saved = await this.streamRepo.save(stream);

    return {
      status: HttpStatus.OK,
      code: 0,
      message: saved.is_live ? '已开播' : '已停播',
      data: saved,
    };
  }
}
