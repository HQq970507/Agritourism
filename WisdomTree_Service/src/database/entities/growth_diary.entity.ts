import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { AdoptionsEntity } from './adoptions.entity';

/**
 * 生长日记实体类
 *
 * 映射数据库中的 growth_diary 表，记录认养产品的生长历程。
 * 每条记录代表一次生长观察日记，包含生长阶段、天数、
 * 温度/湿度环境数据以及AI生成的描述文案，created_at 即日记日期。
 */
@Entity('growth_diary')
export class GrowthDiaryEntity {
  /**
   * 日记ID
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  /**
   * 认养产品名称（如：红颜草莓）
   */
  @Index()
  @Column({ type: 'varchar', length: 100 })
  product_name: string;

  /**
   * 生长阶段：seedling | growing | flowering | fruiting | harvest
   */
  @Column({ type: 'varchar', length: 50 })
  stage: string;

  /**
   * 认养天数（自认养起的天数）
   */
  @Column({ type: 'int', default: 0 })
  day_count: number;

  /**
   * AI生成的日记文案
   */
  @Column({ type: 'text' })
  description: string;

  /**
   * 温度（如：18-25°C）
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  temperature: string;

  /**
   * 湿度（如：60%）
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  humidity: string;

  /**
   * 媒体资源URL（图片/视频，可选）
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  media_url: string;

  /**
   * 日记日期（创建时间）
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  /**
   * 写日记的用户（可空：兼容系统自动生成的生长日记）
   */
  @Index()
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  /**
   * 关联的认领记录（可空：兼容未关联认领的系统日记）
   */
  @Index()
  @ManyToOne(() => AdoptionsEntity)
  @JoinColumn({ name: 'adoption_id' })
  adoption: AdoptionsEntity;
}
