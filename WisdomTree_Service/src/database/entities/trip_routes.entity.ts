import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TripRouteStopEntity } from './trip_route_stops.entity';

/**
 * 精品线路库实体类
 *
 * 该类映射数据库中的 trip_routes 表，存储乡村旅游精品线路的
 * 基本信息（名称、分类、时长、距离、难度、最佳季节等），
 * 一条线路包含多个站点（stops）。
 */
@Entity('trip_routes')
export class TripRouteEntity {
  /**
   * 线路ID
   * 自增长的主键，用于唯一标识每条线路。
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // 线路名称（如：草莓采摘亲子线）
  @Column({ type: 'varchar', length: 100 })
  name: string;

  // 展示标题
  @Column({ type: 'varchar', length: 200 })
  title: string;

  // 线路分类（采摘/亲子/研学/康养/美食/观光）
  @Column({ type: 'varchar', length: 50 })
  category: string;

  // 封面图
  @Column({ type: 'varchar', length: 255, nullable: true })
  cover_image: string;

  // 线路介绍
  @Column({ type: 'text' })
  description: string;

  // 行程时长（小时）
  @Column({ type: 'int', default: 0 })
  duration_hours: number;

  // 线路里程（公里）
  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  distance_km: number;

  // 难度（轻松/适中/挑战）
  @Column({ type: 'varchar', length: 20 })
  difficulty: string;

  // 最佳游玩季节（如：12月-4月）
  @Column({ type: 'varchar', length: 100 })
  best_season: string;

  // 是否推荐
  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  // 线路状态（active/inactive）
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  // 归属用户（null=平台模板）
  @Column({ type: 'int', unsigned: true, nullable: true })
  user_id: number;

  // 来源（template/ai/manual）
  @Column({ type: 'varchar', length: 20, default: 'template' })
  source: string;

  // 是否为平台模板
  @Column({ type: 'boolean', default: true })
  is_template: boolean;

  /**
   * 线路站点
   * 一对多关系，一条线路包含多个站点，按 order_index 排序。
   */
  @OneToMany(() => TripRouteStopEntity, (stop) => stop.route)
  stops: TripRouteStopEntity[];

  /**
   * 创建时间
   */
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;
}
