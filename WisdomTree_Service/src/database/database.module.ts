import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { createConnection } from 'mysql2/promise'; // 导入 mysql2/promise
import { UserEntity } from './entities/user.entity';
import { TreeEntity } from './entities/trees.entity';
import { TreeImagesEntity } from './entities/treeImages.entity';
import { AdoptionsEntity } from './entities/adoptions.entity';
import AdminUserEntity from './entities/adminUser.entity';
import { TreeTypeEntity } from './entities/treeType.entity';
import { PostEntity } from './entities/community/post.entity';
import { CollectEntity } from './entities/collect.entity';
import { CommentEntity } from './entities/community/comment.entity';
import { LikeEntity } from './entities/community/likes.entity';
import { ActivityEntity } from './entities/activity.entity';
import { EnergyEntity } from './entities/energy.entity';
import { ProductEntity } from './entities/products.entity';
import { ProductCategoryEntity } from './entities/product_categories.entity';
import { ProductMediaEntity } from './entities/product_media.entity';
import { OrderEntity } from './entities/orders.entity';
import { PointsEntity } from './entities/points.entity';
import { TraceabilityEntity } from './entities/traceability.entity';
import { PaymentEntity } from './entities/payment.entity';
import { TripRouteEntity } from './entities/trip_routes.entity';
import { TripRouteStopEntity } from './entities/trip_route_stops.entity';
import { FarmFacilityEntity } from './entities/farm_facilities.entity';
import { TripReservationEntity } from './entities/trip_reservations.entity';
import { ScenicSpotEntity } from './entities/scenic_spots.entity';
import { AutomationTaskEntity } from './entities/automation_task.entity';
import { TaskExecutionLogEntity } from './entities/task_execution_log.entity';
import { GrowthDiaryEntity } from './entities/growth_diary.entity';
import { LivestreamEntity } from './entities/livestream.entity';
import { ContractTemplateEntity } from './entities/contract_template.entity';
import { ContractEntity } from './entities/contract.entity';

/**
 * 数据库模块，用于配置和初始化TypeORM以连接到数据库。
 * 该模块还导出TypeOrmModule，以便其他模块可以使用实体。
 */
@Module({
  imports: [
    /**
     * 配置TypeORM模块以异步方式初始化数据库连接。
     * 使用配置模块（ConfigModule）提供的配置服务（ConfigService）来动态获取数据库连接参数。
     */
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST');
        const port = +configService.get<number>('DB_PORT');
        const username = configService.get<string>('DB_USERNAME');
        const password = configService.get<string>('DB_PASSWORD');
        const database = configService.get<string>('DB_DATABASE');

        // 检查并创建数据库
        const connection = await createConnection({
          host,
          port,
          user: username,
          password,
        });

        await connection.query(
          `CREATE DATABASE IF NOT EXISTS \`${database}\`;`,
        );
        await connection.end();

        return {
          type: 'mysql',
          host,
          port,
          username,
          password,
          database,
          synchronize: true, // 在开发时可以使用，生产环境建议设为 false
          autoLoadEntities: true,
        };
      },
    }),
    /**
     * 注册实体模块，使得TypeORM可以管理这些实体。
     */
    TypeOrmModule.forFeature([
      UserEntity,
      TreeEntity,
      TreeImagesEntity,
      AdoptionsEntity,
      AdminUserEntity,
      TreeTypeEntity,
      PostEntity,
      CollectEntity,
      CommentEntity,
      LikeEntity,
      ActivityEntity,
      EnergyEntity,
      ProductEntity,
      ProductCategoryEntity,
      ProductMediaEntity,
      OrderEntity,
      PointsEntity,
      TraceabilityEntity,
      PaymentEntity,
      TripRouteEntity,
      TripRouteStopEntity,
      FarmFacilityEntity,
      TripReservationEntity,
      ScenicSpotEntity,
      ContractTemplateEntity,
      ContractEntity,
      GrowthDiaryEntity,
      LivestreamEntity,
      AutomationTaskEntity,
      TaskExecutionLogEntity,
    ]),
  ],
  providers: [],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
