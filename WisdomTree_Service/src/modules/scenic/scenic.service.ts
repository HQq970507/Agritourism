import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScenicSpotEntity } from 'src/database/entities/scenic_spots.entity';
import { ApiResponse } from 'src/common/interfaces/res.interface';

@Injectable()
export class ScenicService {
  constructor(
    @InjectRepository(ScenicSpotEntity)
    private readonly scenicRepo: Repository<ScenicSpotEntity>,
  ) {}

  /**
   * 景区列表
   * 可按 city 或 level 筛选。
   */
  async getScenicList(
    city?: string,
    level?: string,
  ): Promise<ApiResponse<ScenicSpotEntity[]>> {
    const where: any = {};
    if (city) where.city = city;
    if (level) where.level = level;

    const list = await this.scenicRepo.find({
      where,
      order: { is_featured: 'DESC', id: 'ASC' },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: list,
    };
  }

  /**
   * 景区详情
   */
  async getScenicDetail(id: number): Promise<ApiResponse<ScenicSpotEntity>> {
    const spot = await this.scenicRepo.findOne({ where: { id } });
    if (!spot) {
      throw new HttpException('景区不存在', HttpStatus.NOT_FOUND);
    }
    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: spot,
    };
  }

  /**
   * 按城市获取景区（宁夏地图联动用）
   */
  async getByCity(city: string): Promise<ApiResponse<ScenicSpotEntity[]>> {
    const list = await this.scenicRepo.find({
      where: { city },
      order: { is_featured: 'DESC', id: 'ASC' },
    });
    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: list,
    };
  }
}
