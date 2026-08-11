import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between, FindOptionsWhere } from 'typeorm';
import { ProductCategoryEntity } from 'src/database/entities/product_categories.entity';
import { ActivityEntity } from 'src/database/entities/activity.entity';
import { ScenicSpotEntity } from 'src/database/entities/scenic_spots.entity';
import { AgentTool } from './base.tool';

@Injectable()
export class TripTool implements AgentTool {
  readonly name = 'trip_planning';
  readonly description = '智能行程规划，推荐农旅活动和游玩路线';
  readonly parameters = {
    type: 'object',
    properties: {
      time: {
        type: 'string',
        description: '计划出行时间，如"周末"、"下周"、"2025-05-01"',
      },
      participants: {
        type: 'string',
        description: '参与人员，如"孩子"、"家庭"、"朋友"',
      },
      preference: {
        type: 'string',
        description: '偏好，如"采摘"、"亲子"、"体验农活"',
      },
    },
  };

  private readonly logger = new Logger(TripTool.name);

  constructor(
    @InjectRepository(ProductCategoryEntity)
    private readonly catRepo: Repository<ProductCategoryEntity>,
    @InjectRepository(ActivityEntity)
    private readonly actRepo: Repository<ActivityEntity>,
    @InjectRepository(ScenicSpotEntity)
    private readonly scenicRepo: Repository<ScenicSpotEntity>,
  ) {}

  async execute(params: any, _userId: number): Promise<any> {
    try {
      const time = params?.time || '';
      const participants = params?.participants || '';
      const preference = params?.preference || '';

      // 1. Query upcoming activities (next 30 days)
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const activityWhere: FindOptionsWhere<ActivityEntity> = {
        startTime: Between(now, thirtyDaysLater),
      };

      let activities = await this.actRepo.find({
        where: activityWhere,
        order: { startTime: 'ASC' },
        take: 10,
      });

      // Filter activities by preference keyword if provided
      if (preference && activities.length > 0) {
        const keyword = preference;
        activities = activities.filter(
          (a) =>
            a.title.includes(keyword) ||
            a.content.includes(keyword) ||
            a.location.includes(keyword),
        );
      }

      // 2. Query product categories available for picking / adoption
      const categories = await this.catRepo.find({
        where: { remaining: MoreThan(0) },
        order: { remaining: 'DESC' },
        take: 8,
      });

      // 3. Build structured result
      const schedule = activities.map((a) => {
        // Determine a reasonable time slot based on startTime
        const hour = new Date(a.startTime).getHours();
        const hourStr = hour < 10 ? `0${hour}:00` : `${hour}:00`;
        const activityEnd = new Date(
          new Date(a.startTime).getTime() + 2 * 60 * 60 * 1000,
        );
        const endHour = activityEnd.getHours();
        const endStr = endHour < 10 ? `0${endHour}:00` : `${endHour}:00`;

        // Suggest a half-day duration
        return {
          time: `${hourStr} - ${endStr}`,
          activity: a.title,
          location: a.location,
          description: a.content?.substring(0, 150) + (a.content?.length > 150 ? '...' : ''),
          duration: '约2小时',
          availableSpots: a.plannedCapacity - a.currentCapacity,
        };
      });

      const productSuggestions = categories.map((c) => ({
        name: c.display_name || c.name,
        description: c.description?.substring(0, 100),
        price: c.price,
        unit: c.unit,
        remaining: c.remaining,
        pointsRequired: c.points_required,
      }));      // 3.5 Query scenic spots (文旅部认证 5A 景区，含实时天气)
      const scenicWhere: any = {};
      if (preference) {
        // 若偏好匹配城市名，则按城市筛选
        const cityMatch = ['银川', '石嘴山', '吴忠', '固原', '中卫'].find((c) =>
          preference.includes(c),
        );
        if (cityMatch) scenicWhere.city = cityMatch;
      }
      const scenicSpots = await this.scenicRepo.find({
        where: scenicWhere,
        order: { is_featured: 'DESC', id: 'ASC' },
        take: 6,
      });
      const scenicSuggestions = scenicSpots.map((s) => {
        const obs = (s.weather && s.weather.obs1h) || {};
        const weatherArr = obs.WEATHER;
        const weatherText = Array.isArray(weatherArr)
          ? weatherArr[0]
          : weatherArr || '';
        return {
          name: s.name,
          level: s.level,
          city: s.city,
          location: s.location,
          temp: obs.TEM ? `${obs.TEM}°C` : null,
          weather: weatherText || null,
          website: s.website || null,
        };
      });

      // 无匹配活动时用景区 + 采摘产品兜底组装基础行程，保证"AI 生成旅程"始终有 schedule 可落库
      if (schedule.length === 0) {
        const slotTimes = ['09:00-11:00', '11:30-13:00', '14:00-16:00', '16:30-18:00'];
        const fallback: any[] = [];
        const featured = scenicSpots.slice(0, 2);
        featured.forEach((s, i) => {
          fallback.push({
            time: slotTimes[i * 2] || `0${9 + i}:00-0${9 + i + 2}:00`,
            activity: `游览 ${s.name}`,
            location: s.location || s.city,
            description: (s.level ? `${s.level}景区 · ` : '') + (s.description ? s.description.substring(0, 100) : `${s.name}，感受宁夏农旅风光`),
            duration: '约2小时',
          });
        });
        const topProducts = categories.slice(0, 2);
        topProducts.forEach((c, i) => {
          const idx = featured.length + i;
          fallback.push({
            time: slotTimes[idx] || slotTimes[slotTimes.length - 1],
            activity: `${c.display_name || c.name}采摘/认养体验`,
            location: '银川周边农旅园区',
            description: (c.description ? c.description.substring(0, 100) : `体验${c.display_name || c.name}的采摘与认养乐趣`),
            duration: '约1.5小时',
          });
        });
        schedule.push(...fallback);
      }

      // Generate smart tips
      const tips: string[] = [];
      if (participants.includes('孩子') || participants.includes('亲子')) {
        tips.push('建议选择亲子友好型活动，注意防晒和补水');
        tips.push('可以让孩子参与简单的采摘和喂养体验，增长农业知识');
      }
      if (preference.includes('采摘')) {
        tips.push('采摘活动建议早上进行，水果更新鲜且气温适宜');
        tips.push('请穿着舒适的衣服和鞋子，建议自备手套和剪刀');
      }
      if (participants.includes('家庭') || participants.includes('朋友')) {
        tips.push('团体出行建议提前预约，确保场地和活动名额充足');
      }
      tips.push('农场提供免费停车场，建议自驾前往');
      tips.push('如遇恶劣天气，活动可能会调整，请提前关注天气预报');

      return {
        found: schedule.length > 0 || productSuggestions.length > 0 || scenicSuggestions.length > 0,
        date: now.toISOString().split('T')[0],
        weather_tip: participants.includes('孩子')
          ? '适宜户外活动，建议做好防晒'
          : '天气良好，适合出行',
        schedule,
        products: productSuggestions,
        scenic: scenicSuggestions,
        tips,
        summary: {
          activityCount: schedule.length,
          productCount: productSuggestions.length,
          scenicCount: scenicSuggestions.length,
          message:
            schedule.length > 0
              ? `为您找到 ${schedule.length} 个合适的活动、${productSuggestions.length} 种可认养产品和 ${scenicSuggestions.length} 个宁夏景区`
              : productSuggestions.length > 0
                ? `近期暂无匹配活动，但为您推荐了 ${productSuggestions.length} 种可认养产品和 ${scenicSuggestions.length} 个宁夏景区`
                : scenicSuggestions.length > 0
                  ? `为您推荐了 ${scenicSuggestions.length} 个宁夏景区`
                  : '暂未找到匹配的行程，请尝试其他关键词',
        },
      };
    } catch (error) {
      this.logger.error(`TripTool error: ${error.message}`);
      return {
        found: false,
        message: '行程规划时出错，请稍后再试',
        schedule: [],
        products: [],
        scenic: [],
        tips: [],
        error: error.message,
      };
    }
  }
}
