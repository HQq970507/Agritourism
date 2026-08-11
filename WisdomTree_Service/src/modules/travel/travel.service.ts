import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TripRouteEntity } from 'src/database/entities/trip_routes.entity';
import { TripRouteStopEntity } from 'src/database/entities/trip_route_stops.entity';
import { FarmFacilityEntity } from 'src/database/entities/farm_facilities.entity';
import { TripReservationEntity } from 'src/database/entities/trip_reservations.entity';
import {
  AdjustJourneyDto,
  AgentSaveJourneyDto,
  CreateReservationDto,
  FacilityMapOut,
  JourneyStopOut,
  SaveJourneyDto,
} from './dto/travel.dto';
import { ApiResponse } from 'src/common/interfaces/res.interface';
import dayjs from 'dayjs';

type JourneyOut = Omit<TripRouteEntity, 'stops'> & { stops: JourneyStopOut[] };

@Injectable()
export class TravelService {
  constructor(
    @InjectRepository(TripRouteEntity)
    private readonly routeRepo: Repository<TripRouteEntity>,
    @InjectRepository(TripRouteStopEntity)
    private readonly stopRepo: Repository<TripRouteStopEntity>,
    @InjectRepository(FarmFacilityEntity)
    private readonly facilityRepo: Repository<FarmFacilityEntity>,
    @InjectRepository(TripReservationEntity)
    private readonly reservationRepo: Repository<TripReservationEntity>,
  ) {}

  /**
   * 线路列表
   * 可按 category 筛选，每条线路包含按 order_index 排序的站点。
   */
  async getRoutes(category?: string): Promise<ApiResponse<TripRouteEntity[]>> {
    const routes = await this.routeRepo.find({
      where: category ? { category, user_id: IsNull() } : { user_id: IsNull() },
      relations: ['stops'],
      order: {
        id: 'ASC',
        stops: { order_index: 'ASC' },
      },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: routes,
    };
  }

  /**
   * 线路详情
   * 返回线路信息及其全部站点（按 order_index 排序）。
   */
  async getRouteDetail(routeId: number): Promise<ApiResponse<TripRouteEntity>> {
    const route = await this.routeRepo.findOne({
      where: { id: routeId },
      relations: ['stops'],
      order: { stops: { order_index: 'ASC' } },
    });

    if (!route) {
      throw new HttpException('线路不存在', HttpStatus.NOT_FOUND);
    }

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: route,
    };
  }

  /**
   * 设施名录
   * 可按 type 筛选。
   */
  async getFacilities(type?: string): Promise<ApiResponse<FarmFacilityEntity[]>> {
    const facilities = await this.facilityRepo.find({
      where: type ? { type } : {},
      order: { id: 'ASC' },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: facilities,
    };
  }

  /**
   * 设施地图标记
   * 仅返回含经纬度的设施，可按 type 筛选。
   */
  async getFacilitiesMap(
    type?: string,
  ): Promise<ApiResponse<FacilityMapOut[]>> {
    const facilities = await this.facilityRepo.find({
      where: type ? { type } : {},
      order: { id: 'ASC' },
    });

    const data: FacilityMapOut[] = facilities
      .filter((f) => f.longitude && f.latitude)
      .map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        city: f.city ?? null,
        longitude: f.longitude,
        latitude: f.latitude,
        description: f.description,
        opening_hours: f.opening_hours,
        contact: f.contact ?? null,
        cover_image: f.cover_image ?? null,
      }));

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data,
    };
  }

  /**
   * 创建线路预约
   * 生成预约编号（RS + YYYYMMDD + 4位随机数），状态初始为 pending。
   */
  async createReservation(
    userId: number,
    dto: CreateReservationDto,
  ): Promise<ApiResponse<TripReservationEntity>> {
    const route = await this.routeRepo.findOne({
      where: { id: dto.routeId },
    });

    if (!route) {
      throw new HttpException('线路不存在', HttpStatus.NOT_FOUND);
    }

    if (route.status !== 'active') {
      throw new HttpException('该线路暂未开放预约', HttpStatus.BAD_REQUEST);
    }

    const reservationNo = await this.generateReservationNo();

    const reservation = await this.reservationRepo.save({
      reservation_no: reservationNo,
      route: { id: dto.routeId },
      user: { id: userId },
      visit_date: dto.visitDate,
      party_size: dto.partySize,
      contact_name: dto.contactName,
      contact_phone: dto.contactPhone,
      remark: dto.remark ?? null,
      status: 'pending',
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '预约成功',
      data: reservation,
    };
  }

  /**
   * 我的预约列表（含线路信息）
   */
  async getMyReservations(userId: number): Promise<ApiResponse<any[]>> {
    const reservations = await this.reservationRepo.find({
      where: { user: { id: userId } },
      relations: ['route'],
      order: { id: 'DESC' },
    });

    const data = reservations.map((r) => ({
      id: r.id,
      reservation_no: r.reservation_no,
      routeId: r.route?.id ?? null,
      routeName: r.route?.name ?? '',
      routeTitle: r.route?.title ?? '',
      cover_image: r.route?.cover_image ?? '',
      visit_date: r.visit_date,
      party_size: r.party_size,
      contact_name: r.contact_name,
      contact_phone: r.contact_phone,
      status: r.status,
      remark: r.remark,
      created_at: r.created_at,
    }));

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data,
    };
  }

  /**
   * 取消预约
   * 仅本人可取消自己的预约，状态置为 cancelled。
   */
  async cancelReservation(
    userId: number,
    reservationId: number,
  ): Promise<ApiResponse<TripReservationEntity>> {
    const reservation = await this.reservationRepo.findOne({
      where: { id: reservationId, user: { id: userId } },
    });

    if (!reservation) {
      throw new HttpException('预约不存在', HttpStatus.NOT_FOUND);
    }

    if (reservation.status === 'cancelled') {
      throw new HttpException('该预约已取消', HttpStatus.BAD_REQUEST);
    }

    if (reservation.status === 'completed') {
      throw new HttpException('已完成预约无法取消', HttpStatus.BAD_REQUEST);
    }

    await this.reservationRepo.update(
      { id: reservation.id },
      { status: 'cancelled' },
    );

    const updated = await this.reservationRepo.findOne({
      where: { id: reservationId },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '取消成功',
      data: updated,
    };
  }

  /**
   * 旅程列表
   * type=template 仅平台模板（user_id IS NULL，按 id ASC）
   * type=mine 仅当前用户旅程（按 id DESC）
   * type=all（默认）模板 + 我的旅程
   * category 可选：按分类筛选（如 采摘/研学/丰收/美食）
   */
  async getJourneys(
    userId: number,
    type?: string,
    category?: string,
  ): Promise<ApiResponse<JourneyOut[]>> {
    const where =
      type === 'template'
        ? { user_id: IsNull() }
        : type === 'mine'
          ? { user_id: userId }
          : [{ user_id: IsNull() }, { user_id: userId }];

    const categoryWhere = category
      ? Array.isArray(where)
        ? where.map((w) => ({ ...w, category }))
        : { ...where, category }
      : where;

    const journeys = await this.routeRepo.find({
      where: categoryWhere,
      relations: ['stops'],
      order: {
        id: type === 'template' ? 'ASC' : 'DESC',
        stops: { order_index: 'ASC' },
      },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: journeys.map((j) => this.formatJourney(j)),
    };
  }

  /**
   * 旅程详情（含按 order_index 排序的站点）
   * 我的旅程仅本人可见，模板旅程任何人可见。
   */
  async getJourneyDetail(
    userId: number,
    journeyId: number,
  ): Promise<ApiResponse<JourneyOut>> {
    const journey = await this.routeRepo.findOne({
      where: { id: journeyId },
      relations: ['stops'],
      order: { stops: { order_index: 'ASC' } },
    });

    if (!journey) {
      throw new HttpException('旅程不存在', HttpStatus.NOT_FOUND);
    }

    if (!journey.is_template && journey.user_id !== userId) {
      throw new HttpException('无权查看该旅程', HttpStatus.FORBIDDEN);
    }

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: this.formatJourney(journey),
    };
  }

  /**
   * 保存旅程
   * source 由请求方指定（'ai' 或 'manual'，默认 'ai'），
   * 保存为当前用户旅程（user_id=req.user.id，is_template=false）。
   */
  async saveJourney(
    userId: number,
    dto: SaveJourneyDto,
  ): Promise<ApiResponse<{ id: number }>> {
    const journey = await this.routeRepo.save({
      name: dto.name,
      title: dto.title ?? dto.name,
      category: dto.category ?? '观光',
      description: dto.description ?? '',
      duration_hours: dto.durationHours ?? 0,
      distance_km: dto.distanceKm ?? 0,
      difficulty: dto.difficulty ?? '轻松',
      best_season: dto.bestSeason ?? '全年',
      cover_image: dto.coverImage ?? null,
      user_id: userId,
      source: dto.source === 'manual' ? 'manual' : 'ai',
      is_template: false,
      status: 'active',
      is_featured: false,
    });

    if (dto.stops && dto.stops.length > 0) {
      await this.stopRepo.save(
        dto.stops.map((s, index) => ({
          route: { id: journey.id },
          order_index: index + 1,
          name: s.name,
          type: s.type,
          time_slot: s.timeSlot ?? '',
          duration_minutes: s.durationMinutes ?? 0,
          description: s.description ?? '',
          location: s.location ?? null,
        })),
      );
    }

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '保存成功',
      data: { id: journey.id },
    };
  }

  /**
   * 手动调整旅程
   * 校验旅程存在且属于当前用户且非模板；以调整后的站点列表整体替换，
   * 重排 order_index；调整后 source 置为 'manual'。
   */
  async adjustJourney(
    userId: number,
    journeyId: number,
    dto: AdjustJourneyDto,
  ): Promise<ApiResponse<JourneyOut>> {
    const journey = await this.routeRepo.findOne({
      where: { id: journeyId },
    });

    if (!journey) {
      throw new HttpException('旅程不存在', HttpStatus.NOT_FOUND);
    }

    if (journey.is_template || journey.user_id !== userId) {
      throw new HttpException('无权调整该旅程', HttpStatus.FORBIDDEN);
    }

    await this.routeRepo.manager.transaction(async (manager) => {
      await manager.delete(TripRouteStopEntity, { route: { id: journeyId } });

      if (dto.stops && dto.stops.length > 0) {
        const stops = dto.stops.map((s, index) => ({
          route: { id: journeyId },
          order_index: index + 1,
          name: s.name,
          type: s.type,
          time_slot: s.timeSlot ?? '',
          duration_minutes: s.durationMinutes ?? 0,
          description: s.description ?? '',
          location: s.location ?? null,
        }));
        await manager.save(TripRouteStopEntity, stops);
      }

      await manager.update(
        TripRouteEntity,
        { id: journeyId },
        { source: 'manual' },
      );
    });

    const updated = await this.routeRepo.findOne({
      where: { id: journeyId },
      relations: ['stops'],
      order: { stops: { order_index: 'ASC' } },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '调整成功',
      data: this.formatJourney(updated),
    };
  }

  /**
   * 从 AI 生成结果保存旅程
   * schedule 为 TripTool 输出结构，每个项转为一个站点；
   * 旅程名取「AI 智能旅程 YYYY-MM-DD」，category='智能'，source='ai'。
   */
  async saveAgentJourney(
    userId: number,
    dto: AgentSaveJourneyDto,
  ): Promise<ApiResponse<{ id: number }>> {
    const schedule = dto.schedule ?? [];
    const stops = schedule.map((item, index) => ({
      route: { id: 0 },
      order_index: index + 1,
      name: item.activity,
      type: '观光',
      time_slot: item.time ?? '',
      duration_minutes: this.parseDuration(item.duration),
      description: item.description ?? '',
      location: item.location ?? null,
    }));

    const journey = await this.routeRepo.save({
      name: `AI 智能旅程 ${dayjs().format('YYYY-MM-DD')}`,
      title: `AI 智能旅程 ${dayjs().format('YYYY-MM-DD')}`,
      category: '智能',
      description: '',
      duration_hours: 0,
      distance_km: 0,
      difficulty: '轻松',
      best_season: '全年',
      cover_image: null,
      user_id: userId,
      source: 'ai',
      is_template: false,
      status: 'active',
      is_featured: false,
    });

    if (stops.length > 0) {
      await this.stopRepo.save(
        stops.map((s) => ({ ...s, route: { id: journey.id } })),
      );
    }

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '保存成功',
      data: { id: journey.id },
    };
  }

  /**
   * 站点字段转为驼峰命名（id/orderIndex/name/type/timeSlot/durationMinutes/description/location）
   */
  private formatJourney(journey: TripRouteEntity): JourneyOut {
    return {
      ...journey,
      stops: (journey.stops ?? [])
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((s) => ({
          id: s.id,
          orderIndex: s.order_index,
          name: s.name,
          type: s.type,
          timeSlot: s.time_slot,
          durationMinutes: s.duration_minutes,
          description: s.description,
          location: s.location,
        })),
    };
  }

  /**
   * 解析行程时长：如「约2小时」→120，默认 120 分钟
   */
  private parseDuration(duration?: string): number {
    if (!duration) {
      return 120;
    }
    const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*小时/);
    if (hourMatch) {
      return Math.round(parseFloat(hourMatch[1]) * 60);
    }
    const minuteMatch = duration.match(/(\d+)\s*分钟/);
    if (minuteMatch) {
      return parseInt(minuteMatch[1], 10);
    }
    return 120;
  }

  /**
   * 生成预约编号：RS + YYYYMMDD + 4位随机数
   */
  private async generateReservationNo(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const datePart = dayjs().format('YYYYMMDD');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const no = `RS${datePart}${randomPart}`;
      const existing = await this.reservationRepo.findOne({
        where: { reservation_no: no },
      });
      if (!existing) {
        return no;
      }
    }
    throw new HttpException('预约编号生成失败，请重试', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
