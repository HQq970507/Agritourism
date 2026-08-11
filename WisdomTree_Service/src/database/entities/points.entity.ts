import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';

// 积分表
@Entity('points')
@Unique(['user', 'date', 'source']) // 联合唯一约束：同一用户同一天同一来源一条记录
export class PointsEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // 今日已领取的积分值
  @Column({ type: 'int', default: 0 })
  receivedPoints: number;

  // 今日目前的总积分值
  @Column({ type: 'int', default: 0 })
  points: number;

  // 是否领取完积分
  @Column({ type: 'boolean', default: false })
  finish: boolean;

  // 积分来源（如：daily, order, activity）
  @Column({ type: 'varchar', length: 50, default: 'daily' })
  source: string;

  // 当天日期 如2025-01-01
  @Column({ type: 'date' })
  date: string;

  // 多对一 绑定用户
  @ManyToOne(() => UserEntity, (user) => user.points)
  user: UserEntity;
}
