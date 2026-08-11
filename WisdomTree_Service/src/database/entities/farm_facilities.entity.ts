import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 设施名录实体类
 *
 * 该类映射数据库中的 farm_facilities 表，存储乡村农场各类设施
 * （采摘园、体验区、餐厅、民宿、研学基地、观景台等）的名录信息，
 * 便于用户查找和预约。
 */
@Entity('farm_facilities')
export class FarmFacilityEntity {
  /**
   * 设施ID
   * 自增长的主键，用于唯一标识每个设施。
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // 设施名称（如：红颜草莓采摘园）
  @Column({ type: 'varchar', length: 100 })
  name: string;

  // 设施类型（采摘园/体验区/餐厅/民宿/研学基地/观景台）
  @Column({ type: 'varchar', length: 50 })
  type: string;

  // 设施介绍
  @Column({ type: 'text' })
  description: string;

  // 开放时间（如：09:00-17:00）
  @Column({ type: 'varchar', length: 100 })
  opening_hours: string;

  // 联系电话
  @Column({ type: 'varchar', length: 100, nullable: true })
  contact: string;

  // 所在位置
  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  // 经度（如：106.25）
  @Column({ type: 'varchar', length: 30, nullable: true })
  longitude: string;

  // 纬度（如：38.46）
  @Column({ type: 'varchar', length: 30, nullable: true })
  latitude: string;

  // 所在城市（银川/石嘴山/吴忠/固原/中卫）
  @Column({ type: 'varchar', length: 50, nullable: true })
  city: string;

  // 封面图
  @Column({ type: 'varchar', length: 255, nullable: true })
  cover_image: string;

  // 设施状态（open/closed）
  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string;

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
