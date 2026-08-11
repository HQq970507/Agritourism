import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 景区景点实体类
 *
 * 该类映射数据库中的 scenic_spots 表，存储宁夏文旅部认证的
 * 5A级旅游景区及国家级旅游度假区等信息（名称、城市、位置、
 * 简介、特色项目、门票、开放时间等），便于用户浏览和规划行程。
 */
@Entity('scenic_spots')
export class ScenicSpotEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // 景区名称（如：沙坡头旅游景区）
  @Column({ type: 'varchar', length: 100 })
  name: string;

  // 景区级别（5A/4A/国家级旅游度假区/五星级旅游饭店）
  @Column({ type: 'varchar', length: 50 })
  level: string;

  // 所在城市（银川/石嘴山/吴忠/固原/中卫）
  @Column({ type: 'varchar', length: 50 })
  city: string;

  // 详细位置
  @Column({ type: 'varchar', length: 255 })
  location: string;

  // 景区简介
  @Column({ type: 'text' })
  description: string;

  // 特色项目（JSON 数组字符串）
  @Column({ type: 'json', nullable: true })
  features: string[];

  // 封面图
  @Column({ type: 'varchar', length: 255, nullable: true })
  cover_image: string;

  // 开放时间
  @Column({ type: 'varchar', length: 100, nullable: true })
  opening_hours: string;

  // 门票参考（如：80元/人）
  @Column({ type: 'varchar', length: 100, nullable: true })
  ticket: string;

  // 联系电话
  @Column({ type: 'varchar', length: 100, nullable: true })
  contact: string;

  // 天气编码（对应 weather 模块 CITY_CODES，如 101170501）
  @Column({ type: 'varchar', length: 20, nullable: true })
  weather_code: string;

  // 经度（文旅部API提供）
  @Column({ type: 'varchar', length: 30, nullable: true })
  longitude: string;

  // 纬度（文旅部API提供）
  @Column({ type: 'varchar', length: 30, nullable: true })
  latitude: string;

  // 官方网站
  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  // 实时天气（文旅部API内嵌，JSON 存储）
  @Column({ type: 'json', nullable: true })
  weather: any;

  // 文旅部 marker ID（用于同步去重）
  @Column({ type: 'int', nullable: true, unique: true })
  marker_id: number;

  // 数据来源（mct=文旅部API同步 / custom=手动添加）
  @Column({ type: 'varchar', length: 20, default: 'mct' })
  source: string;

  // 是否推荐
  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;
}
