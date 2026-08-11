import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TripRouteEntity } from './trip_routes.entity';
import { UserEntity } from './user.entity';

/**
 * 线路预约实体类
 *
 * 该类映射数据库中的 trip_reservations 表，记录用户对精品线路的预约
 * 信息（预约编号、游玩日期、人数、联系方式、状态等），
 * 形成预约-确认-完成-取消的闭环管理。
 */
@Entity('trip_reservations')
export class TripReservationEntity {
  /**
   * 预约ID
   * 自增长的主键，用于唯一标识每条预约记录。
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // 预约编号（格式：RS + YYYYMMDD + 4位随机数）
  @Column({ type: 'varchar', length: 100, unique: true })
  reservation_no: string;

  /**
   * 预约的线路
   * 多对一关系，关联精品线路表。
   */
  @ManyToOne(() => TripRouteEntity)
  @JoinColumn({ name: 'route_id' })
  route: TripRouteEntity;

  /**
   * 预约用户
   * 多对一关系，关联用户表。
   */
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  // 预约游玩日期（如：2026-08-10）
  @Column({ type: 'varchar', length: 20 })
  visit_date: string;

  // 游玩人数
  @Column({ type: 'int', default: 1 })
  party_size: number;

  // 联系人姓名
  @Column({ type: 'varchar', length: 100 })
  contact_name: string;

  // 联系电话
  @Column({ type: 'varchar', length: 50 })
  contact_phone: string;

  // 预约状态（pending/confirmed/completed/cancelled）
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  // 备注
  @Column({ type: 'text', nullable: true })
  remark: string;

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
