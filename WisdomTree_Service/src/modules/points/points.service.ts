import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, EntityManager } from 'typeorm';
import { PointsEntity } from 'src/database/entities/points.entity';
import { UserEntity } from 'src/database/entities/user.entity';
import dayjs from 'dayjs';
import {
  CheckInResponseDto,
  PointsHistoryResponseDto,
  PointsRecordDto,
  LeaderboardEntryDto,
  PointsSummaryResponseDto,
} from './dto/points.dto';

@Injectable()
export class PointsService {
  private readonly CHECKIN_POINTS = 10;

  constructor(
    @InjectRepository(PointsEntity)
    private readonly pointsRepo: Repository<PointsEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * 通用积分发放（认领 +50 / 写日记 +1 等场景复用）
   * 同一用户同一天同一来源的积分累计到同一条记录（points 表按 user+date+source 唯一）。
   * @param manager 可选事务管理器，传入时积分流水与用户能量更新在同一事务内执行
   */
  async addPoints(
    userId: number,
    points: number,
    source: string,
    date: string = dayjs().format('YYYY-MM-DD'),
    manager?: EntityManager,
  ): Promise<void> {
    const pointsRepo = manager
      ? manager.getRepository(PointsEntity)
      : this.pointsRepo;
    const userRepo = manager ? manager.getRepository(UserEntity) : this.userRepo;

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    const existing = await pointsRepo.findOne({
      where: { user: { id: userId }, date, source },
    });

    if (existing) {
      await pointsRepo.update(
        { id: existing.id },
        {
          receivedPoints: existing.receivedPoints + points,
          points: existing.points + points,
          finish: true,
        },
      );
    } else {
      await pointsRepo.save({
        user: { id: userId },
        receivedPoints: points,
        points: points,
        finish: true,
        source,
        date,
      });
    }

    await userRepo.update({ id: userId }, { energy: user.energy + points });
  }

  /**
   * 每日签到
   * 每天可签到一次，获得固定积分，并计算连续签到天数
   */
  async checkIn(userId: number): Promise<CheckInResponseDto> {
    const today = dayjs().format('YYYY-MM-DD');

    // 检查今天是否已签到
    const existing = await this.pointsRepo.findOne({
      where: { user: { id: userId }, date: today, source: 'checkin' },
    });

    if (existing) {
      throw new HttpException('今日已签到，请明天再来', HttpStatus.BAD_REQUEST);
    }

    // 创建签到积分记录
    await this.pointsRepo.save({
      user: { id: userId },
      receivedPoints: this.CHECKIN_POINTS,
      points: this.CHECKIN_POINTS,
      finish: true,
      source: 'checkin',
      date: today,
    });

    // 更新用户总积分
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }
    await this.userRepo.update(
      { id: userId },
      { energy: user.energy + this.CHECKIN_POINTS },
    );

    // 计算连续签到天数
    const streak = await this.calculateStreak(userId);

    return {
      points: this.CHECKIN_POINTS,
      streak,
      total: user.energy + this.CHECKIN_POINTS,
    };
  }

  /**
   * 获取积分历史记录（分页）
   */
  async getHistory(
    userId: number,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PointsHistoryResponseDto> {
    const skip = (page - 1) * pageSize;

    const [records, total] = await this.pointsRepo.findAndCount({
      where: { user: { id: userId } },
      order: { date: 'DESC', id: 'DESC' },
      skip,
      take: pageSize,
    });

    const dtoRecords: PointsRecordDto[] = records.map((r) => ({
      id: r.id,
      points: r.points,
      receivedPoints: r.receivedPoints,
      source: r.source,
      date: r.date,
      finish: r.finish,
    }));

    return {
      records: dtoRecords,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取积分排行榜
   */
  async getLeaderboard(limit: number = 20): Promise<LeaderboardEntryDto[]> {
    const users = await this.userRepo.find({
      order: { energy: 'DESC' },
      take: limit,
      select: ['id', 'username', 'avatar', 'energy'],
    });

    return users.map((u, index) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      energy: u.energy,
      rank: index + 1,
    }));
  }

  /**
   * 获取用户积分概览
   */
  async getSummary(userId: number): Promise<PointsSummaryResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    const today = dayjs().format('YYYY-MM-DD');

    // 查询今天获得的积分总和
    const todayRecords = await this.pointsRepo.find({
      where: { user: { id: userId }, date: today },
    });
    const todayEarned = todayRecords.reduce(
      (sum, r) => sum + r.receivedPoints,
      0,
    );

    // 查询今天是否已签到
    const todayCheckin = todayRecords.find((r) => r.source === 'checkin');
    const checkInDone = !!todayCheckin;

    // 计算连续签到天数
    const streak = await this.calculateStreak(userId);

    return {
      total: user.energy,
      todayEarned,
      checkInDone,
      streak,
    };
  }

  /**
   * 计算连续签到天数
   */
  private async calculateStreak(userId: number): Promise<number> {
    const checkins = await this.pointsRepo.find({
      where: { user: { id: userId }, source: 'checkin' },
      order: { date: 'DESC' },
    });

    if (checkins.length === 0) return 0;

    let streak = 1;
    for (let i = 1; i < checkins.length; i++) {
      const prev = dayjs(checkins[i - 1].date);
      const curr = dayjs(checkins[i].date);
      if (prev.diff(curr, 'day') === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
