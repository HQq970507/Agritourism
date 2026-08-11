import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScenicSpotEntity } from 'src/database/entities/scenic_spots.entity';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

const MCT_API_BASE = 'https://lyfw.mct.gov.cn';
const NINGXIA_PROVINCE_ID = 640000;

// 要同步的省份（pkey → 省份ID），可扩展其他省份
const SYNC_PROVINCES: { id: number; key: string }[] = [
  { id: NINGXIA_PROVINCE_ID, key: 'ningxia' },
];

@Injectable()
export class ScenicSyncService implements OnModuleInit {
  private readonly logger = new Logger(ScenicSyncService.name);
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(ScenicSpotEntity)
    private readonly scenicRepo: Repository<ScenicSpotEntity>,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.syncFromMct();
      // 文旅部天气约10分钟更新，定时每30分钟同步一次
      this.syncTimer = setInterval(
        () => this.syncFromMct().catch((e) => this.logger.warn(`同步失败: ${e.message}`)),
        30 * 60 * 1000,
      );
      this.logger.log('文旅部景区数据同步服务已启动（每30分钟）');
    } catch (e) {
      this.logger.warn(`初始同步失败（将使用已有数据）: ${e.message}`);
    }
  }

  async syncFromMct(): Promise<number> {
    let synced = 0;
    for (const province of SYNC_PROVINCES) {
      // type_id: 1=5A景区 2=国家级旅游度假区 3=五星级旅游饭店
      for (const typeId of [1, 2, 3]) {
        try {
          const url = `${MCT_API_BASE}/api/marker/list?type_id=${typeId}&province=${province.id}&pagesize=999`;
          const { data } = await lastValueFrom(
            this.httpService.get(url, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              timeout: 15000,
            }),
          );
          const markers = data?.data?.list || [];
          for (const marker of markers) {
            await this.upsertMarker(marker, typeId);
            synced++;
          }
        } catch (e) {
          this.logger.warn(`${province.key} type_id=${typeId} 拉取失败: ${e.message}`);
        }
      }
    }
    this.logger.log(`文旅部景区同步完成: ${synced} 个资源`);
    return synced;
  }

  private async upsertMarker(marker: any, typeId: number): Promise<void> {
    const level = typeId === 1 ? '5A' : typeId === 2 ? '国家级旅游度假区' : '五星级旅游饭店';
    const name = String(marker.name || '').replace(/^(银川市|石嘴山市|吴忠市|固原市|中卫市)/, '');
    const city = this.mapCity(marker.city_name || marker.city || '');

    const existing = await this.scenicRepo.findOne({
      where: { marker_id: marker.id },
    });

    const data = {
      name: name || marker.name || '',
      level,
      city,
      location: marker.address || '',
      description: marker.introduce || '',
      cover_image: Array.isArray(marker.picture) && marker.picture.length > 0 ? `${MCT_API_BASE}/${marker.picture[0]}` : null,
      longitude: marker.longitude ? String(marker.longitude) : null,
      latitude: marker.latitude ? String(marker.latitude) : null,
      website: marker.url || marker.web_link_url || null,
      weather: marker.weather || null,
      weather_code: this.mapWeatherCode(city),
      marker_id: marker.id,
      source: 'mct',
      is_featured: typeId === 1 || typeId === 2,
    };

    if (existing) {
      await this.scenicRepo.update({ id: existing.id }, data);
    } else {
      await this.scenicRepo.save({ ...data, opening_hours: null, ticket: null, contact: null, features: [] });
    }
  }

  private mapCity(cityName: string): string {
    const name = String(cityName || '');
    if (name.includes('银川')) return '银川';
    if (name.includes('石嘴山')) return '石嘴山';
    if (name.includes('吴忠')) return '吴忠';
    if (name.includes('固原')) return '固原';
    if (name.includes('中卫')) return '中卫';
    return name || '宁夏';
  }

  private mapWeatherCode(city: string): string {
    const map: Record<string, string> = {
      '银川': '101170101',
      '石嘴山': '101170201',
      '吴忠': '101170301',
      '固原': '101170401',
      '中卫': '101170501',
    };
    return map[city] || '101170101';
  }
}
