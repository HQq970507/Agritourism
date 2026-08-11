import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, FindOptionsWhere } from 'typeorm';
import { ActivityEntity } from 'src/database/entities/activity.entity';
import { AgentTool } from './base.tool';

@Injectable()
export class ActivityTool implements AgentTool {
  readonly name = 'activity_query';
  readonly description = '查询近期活动信息，包括活动时间、地点、报名情况等';
  readonly parameters = {
    type: 'object',
    properties: {
      time: {
        type: 'string',
        description: '时间范围: recent(近期), upcoming(即将开始), all(全部)',
        enum: ['recent', 'upcoming', 'all'],
      },
      type: { type: 'string', description: '活动类型关键词' },
    },
  };

  private readonly logger = new Logger(ActivityTool.name);

  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepo: Repository<ActivityEntity>,
  ) {}

  async execute(params: any, _userId: number): Promise<any> {
    try {
      const time = params?.time || 'upcoming';
      const type = params?.type || '';

      let where: FindOptionsWhere<ActivityEntity> = {};

      const now = new Date();

      switch (time) {
        case 'recent':
          // Activities that ended recently or are ongoing
          where = [
            { endTime: MoreThan(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) },
          ] as any;
          break;
        case 'upcoming':
          // Future activities
          where.startTime = MoreThan(now);
          break;
        case 'all':
        default:
          // All activities, no time filter
          break;
      }

      let activities = await this.activityRepo.find({
        where,
        order: { startTime: 'ASC' },
        take: 20,
      });

      // Filter by type keyword if provided
      if (type && activities.length > 0) {
        activities = activities.filter(
          (a) =>
            a.title.includes(type) || a.content.includes(type),
        );
      }

      if (!activities || activities.length === 0) {
        return {
          found: false,
          message: type
            ? `没有找到"${type}"相关的活动`
            : '暂无活动信息',
          activities: [],
        };
      }

      const result = activities.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content?.substring(0, 200) + (a.content?.length > 200 ? '...' : ''),
        startTime: a.startTime,
        endTime: a.endTime,
        location: a.location,
        plannedCapacity: a.plannedCapacity,
        currentCapacity: a.currentCapacity,
        availableSpots: a.plannedCapacity - a.currentCapacity,
        coverImageUrl: a.coverImageUrl,
      }));

      // Determine time description
      let timeDesc = '';
      if (time === 'upcoming') timeDesc = '即将开始';
      else if (time === 'recent') timeDesc = '近期';
      else timeDesc = '全部';

      return {
        found: true,
        count: result.length,
        activities: result,
        message: `找到 ${result.length} 个${timeDesc}活动`,
      };
    } catch (error) {
      this.logger.error(`ActivityTool error: ${error.message}`);
      return {
        found: false,
        message: '查询活动信息时出错，请稍后再试',
        activities: [],
        error: error.message,
      };
    }
  }
}
