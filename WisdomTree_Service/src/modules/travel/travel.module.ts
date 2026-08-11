import { Module, OnModuleInit } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { TokenModule } from '../token/token.module';
import { TravelController } from './travel.controller';
import { TravelService } from './travel.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripRouteEntity } from 'src/database/entities/trip_routes.entity';
import { TripRouteStopEntity } from 'src/database/entities/trip_route_stops.entity';
import { FarmFacilityEntity } from 'src/database/entities/farm_facilities.entity';
import { seedTravelData } from './seed';

/**
 * 旅游模块
 *
 * 负责精品线路库、设施名录与线路预约功能。
 * 模块初始化时自动插入演示种子数据（幂等）。
 */
@Module({
  imports: [DatabaseModule, TokenModule],
  controllers: [TravelController],
  providers: [TravelService],
  exports: [TravelService],
})
export class TravelModule implements OnModuleInit {
  constructor(
    @InjectRepository(TripRouteEntity)
    private readonly routeRepo: Repository<TripRouteEntity>,
    @InjectRepository(TripRouteStopEntity)
    private readonly stopRepo: Repository<TripRouteStopEntity>,
    @InjectRepository(FarmFacilityEntity)
    private readonly facilityRepo: Repository<FarmFacilityEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await seedTravelData(this.routeRepo, this.stopRepo, this.facilityRepo);
  }
}
