import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { TripRouteEntity } from 'src/database/entities/trip_routes.entity';
import { TripRouteStopEntity } from 'src/database/entities/trip_route_stops.entity';
import { FarmFacilityEntity } from 'src/database/entities/farm_facilities.entity';
import { TripReservationEntity } from 'src/database/entities/trip_reservations.entity';
import { ApiResponse } from 'src/common/interfaces/res.interface';
import {
  CreateFacilityDto,
  CreateRouteDto,
  UpdateFacilityDto,
  UpdateRouteDto,
} from '../dto/adminTravel.dto';

@Injectable()
export class AdminTravelService {
  constructor(
    @InjectRepository(TripRouteEntity)
    private readonly routeRepository: Repository<TripRouteEntity>,
    @InjectRepository(TripRouteStopEntity)
    private readonly stopRepository: Repository<TripRouteStopEntity>,
    @InjectRepository(FarmFacilityEntity)
    private readonly facilityRepository: Repository<FarmFacilityEntity>,
    @InjectRepository(TripReservationEntity)
    private readonly reservationRepository: Repository<TripReservationEntity>,
  ) {}

  // ==================== 线路管理 ====================

  /**
   * 线路列表（含站点，按 order_index 排序），可按 category 筛选。
   */
  async getAdminRoutes(
    category?: string,
  ): Promise<ApiResponse<TripRouteEntity[]>> {
    const routes = await this.routeRepository.find({
      where: category ? { category } : {},
      relations: ['stops'],
      order: {
        id: 'ASC',
        stops: { order_index: 'ASC' },
      },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取线路列表成功',
      data: routes,
    };
  }

  /**
   * 新增线路（含站点数组）。
   */
  async createRoute(dto: CreateRouteDto): Promise<ApiResponse<any>> {
    const route = await this.routeRepository.save({
      name: dto.name,
      title: dto.title ?? dto.name,
      category: dto.category,
      description: dto.description ?? '',
      duration_hours: dto.duration_hours ?? 0,
      distance_km: dto.distance_km ?? 0,
      difficulty: dto.difficulty ?? '轻松',
      best_season: dto.best_season ?? '',
      is_featured: dto.is_featured ?? false,
      status: dto.status ?? 'active',
      cover_image: dto.cover_image ?? null,
    });

    if (dto.stops && dto.stops.length > 0) {
      await this.stopRepository.insert(
        dto.stops.map((stop) => ({
          route: { id: route.id },
          order_index: stop.order_index ?? 0,
          name: stop.name,
          type: stop.type ?? '',
          time_slot: stop.time_slot ?? '',
          duration_minutes: stop.duration_minutes ?? 0,
          description: stop.description ?? '',
          location: stop.location ?? null,
        })),
      );
    }

    const result = await this.routeRepository.findOne({
      where: { id: route.id },
      relations: ['stops'],
      order: { stops: { order_index: 'ASC' } },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '新增线路成功',
      data: result,
    };
  }

  /**
   * 修改线路：更新线路字段，删除旧站点并重新插入新站点。
   */
  async updateRoute(
    id: number,
    dto: UpdateRouteDto,
  ): Promise<ApiResponse<any>> {
    const existing = await this.routeRepository.findOne({ where: { id } });
    if (!existing) {
      throw new HttpException('线路不存在', HttpStatus.NOT_FOUND);
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.duration_hours !== undefined)
      updateData.duration_hours = dto.duration_hours;
    if (dto.distance_km !== undefined) updateData.distance_km = dto.distance_km;
    if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty;
    if (dto.best_season !== undefined) updateData.best_season = dto.best_season;
    if (dto.is_featured !== undefined) updateData.is_featured = dto.is_featured;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.cover_image !== undefined) updateData.cover_image = dto.cover_image;

    await this.routeRepository.update({ id }, updateData);

    // 删除旧站点，重新插入新站点
    await this.stopRepository.delete({ route: { id } });
    if (dto.stops && dto.stops.length > 0) {
      await this.stopRepository.insert(
        dto.stops.map((stop) => ({
          route: { id },
          order_index: stop.order_index ?? 0,
          name: stop.name,
          type: stop.type ?? '',
          time_slot: stop.time_slot ?? '',
          duration_minutes: stop.duration_minutes ?? 0,
          description: stop.description ?? '',
          location: stop.location ?? null,
        })),
      );
    }

    const result = await this.routeRepository.findOne({
      where: { id },
      relations: ['stops'],
      order: { stops: { order_index: 'ASC' } },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '修改线路成功',
      data: result,
    };
  }

  /**
   * 删除线路：存在未取消的预约时拒绝删除；否则先删站点再删线路。
   */
  async deleteRoute(id: number): Promise<ApiResponse> {
    const existing = await this.routeRepository.findOne({ where: { id } });
    if (!existing) {
      throw new HttpException('线路不存在', HttpStatus.NOT_FOUND);
    }

    const activeReservationCount = await this.reservationRepository.count({
      where: { route: { id }, status: Not('cancelled') },
    });
    if (activeReservationCount > 0) {
      throw new HttpException(
        '该线路存在未取消的预约，无法删除',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 已取消的预约不阻止删除，但为避免外键约束阻塞，先清理这些历史预约记录
    await this.reservationRepository.delete({
      route: { id },
      status: 'cancelled',
    });

    await this.stopRepository.delete({ route: { id } });
    await this.routeRepository.delete({ id });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '删除线路成功',
    };
  }

  // ==================== 设施管理 ====================

  /**
   * 设施列表，可按 type 筛选。
   */
  async getAdminFacilities(
    type?: string,
  ): Promise<ApiResponse<FarmFacilityEntity[]>> {
    const facilities = await this.facilityRepository.find({
      where: type ? { type } : {},
      order: { id: 'ASC' },
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取设施列表成功',
      data: facilities,
    };
  }

  /**
   * 新增设施。
   */
  async createFacility(dto: CreateFacilityDto): Promise<ApiResponse<any>> {
    const facility = await this.facilityRepository.save({
      name: dto.name,
      type: dto.type,
      description: dto.description ?? '',
      opening_hours: dto.opening_hours ?? '',
      contact: dto.contact ?? null,
      location: dto.location ?? null,
      cover_image: dto.cover_image ?? null,
      status: dto.status ?? 'open',
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '新增设施成功',
      data: facility,
    };
  }

  /**
   * 修改设施。
   */
  async updateFacility(
    id: number,
    dto: UpdateFacilityDto,
  ): Promise<ApiResponse<any>> {
    const existing = await this.facilityRepository.findOne({ where: { id } });
    if (!existing) {
      throw new HttpException('设施不存在', HttpStatus.NOT_FOUND);
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.opening_hours !== undefined)
      updateData.opening_hours = dto.opening_hours;
    if (dto.contact !== undefined) updateData.contact = dto.contact;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.cover_image !== undefined) updateData.cover_image = dto.cover_image;
    if (dto.status !== undefined) updateData.status = dto.status;

    await this.facilityRepository.update({ id }, updateData);

    const result = await this.facilityRepository.findOne({ where: { id } });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '修改设施成功',
      data: result,
    };
  }

  /**
   * 删除设施。
   */
  async deleteFacility(id: number): Promise<ApiResponse> {
    const existing = await this.facilityRepository.findOne({ where: { id } });
    if (!existing) {
      throw new HttpException('设施不存在', HttpStatus.NOT_FOUND);
    }

    await this.facilityRepository.delete({ id });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '删除设施成功',
    };
  }

  // ==================== 预约管理 ====================

  /**
   * 全部预约列表（含线路名称、用户名），按 id 倒序。
   */
  async getAdminReservations(): Promise<ApiResponse<any[]>> {
    const reservations = await this.reservationRepository.find({
      relations: ['route', 'user'],
      order: { id: 'DESC' },
    });

    const data = reservations.map((r) => ({
      id: r.id,
      reservation_no: r.reservation_no,
      routeId: r.route?.id ?? null,
      routeName: r.route?.name ?? '',
      routeTitle: r.route?.title ?? '',
      cover_image: r.route?.cover_image ?? '',
      userId: r.user?.id ?? null,
      username: r.user?.username ?? '',
      visit_date: r.visit_date,
      party_size: r.party_size,
      contact_name: r.contact_name,
      contact_phone: r.contact_phone,
      status: r.status,
      remark: r.remark,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取预约列表成功',
      data,
    };
  }

  /**
   * 修改预约状态（confirmed/completed/cancelled）。
   */
  async updateReservationStatus(
    id: number,
    status: string,
  ): Promise<ApiResponse<any>> {
    const validStatuses = ['confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new HttpException('无效的预约状态', HttpStatus.BAD_REQUEST);
    }

    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });
    if (!reservation) {
      throw new HttpException('预约不存在', HttpStatus.NOT_FOUND);
    }

    await this.reservationRepository.update({ id }, { status });

    const result = await this.reservationRepository.findOne({
      where: { id },
      relations: ['route', 'user'],
    });

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '更新预约状态成功',
      data: result,
    };
  }
}
