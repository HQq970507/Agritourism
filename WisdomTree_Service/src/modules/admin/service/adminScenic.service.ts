import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScenicSpotEntity } from 'src/database/entities/scenic_spots.entity';
import { CreateScenicDto, UpdateScenicDto } from '../dto/adminScenic.dto';

@Injectable()
export class AdminScenicService {
  constructor(
    @InjectRepository(ScenicSpotEntity)
    private readonly scenicRepo: Repository<ScenicSpotEntity>,
  ) {}

  async getScenicList(page: number, pageSize: number) {
    const [list, total] = await this.scenicRepo.findAndCount({
      order: { source: 'ASC', id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取景区列表成功',
      data: { list, total, page, pageSize },
    };
  }

  async createScenic(dto: CreateScenicDto) {
    const exists = await this.scenicRepo.findOne({ where: { name: dto.name } });
    if (exists) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 1,
        message: '景区名称已存在',
      };
    }
    const spot = await this.scenicRepo.save({
      name: dto.name,
      level: dto.level || '自定义',
      city: dto.city || '宁夏',
      location: dto.location || '',
      description: dto.description || '',
      features: dto.features || [],
      cover_image: dto.cover_image || null,
      opening_hours: dto.opening_hours || null,
      ticket: dto.ticket || null,
      contact: dto.contact || null,
      longitude: dto.longitude || null,
      latitude: dto.latitude || null,
      website: dto.website || null,
      weather_code: dto.weather_code || null,
      source: 'custom',
      is_featured: dto.is_featured || false,
    });
    return { status: HttpStatus.OK, code: 0, message: '景区创建成功', data: spot };
  }

  async updateScenic(id: number, dto: UpdateScenicDto) {
    const spot = await this.scenicRepo.findOne({ where: { id } });
    if (!spot) {
      throw new HttpException('景区不存在', HttpStatus.NOT_FOUND);
    }
    await this.scenicRepo.update({ id }, {
      name: dto.name,
      level: dto.level,
      city: dto.city,
      location: dto.location,
      description: dto.description,
      features: dto.features,
      cover_image: dto.cover_image,
      opening_hours: dto.opening_hours,
      ticket: dto.ticket,
      contact: dto.contact,
      longitude: dto.longitude,
      latitude: dto.latitude,
      website: dto.website,
      weather_code: dto.weather_code,
      is_featured: dto.is_featured,
    });
    return { status: HttpStatus.OK, code: 0, message: '景区更新成功' };
  }

  async deleteScenic(id: number) {
    const spot = await this.scenicRepo.findOne({ where: { id } });
    if (!spot) {
      throw new HttpException('景区不存在', HttpStatus.NOT_FOUND);
    }
    // 文旅部同步的数据允许删除（下次同步会重新拉回）
    await this.scenicRepo.delete({ id });
    return { status: HttpStatus.OK, code: 0, message: '景区删除成功' };
  }
}
