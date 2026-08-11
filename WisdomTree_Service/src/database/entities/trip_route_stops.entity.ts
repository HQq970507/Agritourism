import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TripRouteEntity } from './trip_routes.entity';

/**
 * 线路站点实体类
 *
 * 该类映射数据库中的 trip_route_stops 表，存储精品线路中的
 * 各个站点信息（名称、类型、时间段、时长、地点等），
 * 通过多对一关系关联到线路。
 */
@Entity('trip_route_stops')
export class TripRouteStopEntity {
  /**
   * 站点ID
   * 自增长的主键，用于唯一标识每个站点。
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  /**
   * 所属线路
   * 多对一关系，站点归属于某条线路。
   */
  @ManyToOne(() => TripRouteEntity, (route) => route.stops)
  @JoinColumn({ name: 'route_id' })
  route: TripRouteEntity;

  // 站点在线路中的顺序
  @Column({ type: 'int', default: 0 })
  order_index: number;

  // 站点名称（如：红颜草莓采摘园）
  @Column({ type: 'varchar', length: 100 })
  name: string;

  // 站点类型（采摘/体验/餐饮/住宿/观光/研学）
  @Column({ type: 'varchar', length: 50 })
  type: string;

  // 时间段（如：09:00-11:00）
  @Column({ type: 'varchar', length: 50 })
  time_slot: string;

  // 停留时长（分钟）
  @Column({ type: 'int', default: 0 })
  duration_minutes: number;

  // 站点介绍
  @Column({ type: 'text' })
  description: string;

  // 站点地点
  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
