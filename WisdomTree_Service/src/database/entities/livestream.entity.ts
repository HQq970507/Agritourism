import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 慢直播频道实体类
 *
 * 映射数据库中的 livestreams 表，存储认养农场的慢直播频道信息。
 * stream_url 为演示环境使用的占位流地址（mock HLS/RTSP，无需真实拉流）。
 */
@Entity('livestreams')
export class LivestreamEntity {
  /**
   * 频道ID
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  /**
   * 频道名称（如：草莓园慢直播）
   */
  @Column({ type: 'varchar', length: 100 })
  channel_name: string;

  /**
   * 关联的产品名称（如：红颜草莓）
   */
  @Column({ type: 'varchar', length: 100 })
  product_name: string;

  /**
   * 流地址（演示用占位URL，如 https://demo.stream/live/strawberry.m3u8）
   */
  @Column({ type: 'varchar', length: 255 })
  stream_url: string;

  /**
   * 是否正在直播
   */
  @Column({ type: 'boolean', default: false })
  is_live: boolean;

  /**
   * 观看人数
   */
  @Column({ type: 'int', default: 0 })
  viewers: number;

  /**
   * 直播地点（如：银川·贺兰山草莓基地）
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

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
