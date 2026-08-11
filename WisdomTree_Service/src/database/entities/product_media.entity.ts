import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductEntity } from './products.entity';
import { ProductCategoryEntity } from './product_categories.entity';

/**
 * 产品媒体实体类
 *
 * 该类表示与产品相关的媒体信息，包括媒体文件的URL和创建/更新时间。
 * 它通过多对一的关系与产品实体关联，每个产品可以有多个媒体文件。
 */
@Entity('product_media')
export class ProductMediaEntity {
  /**
   * 媒体ID
   *
   * 自动生成的主键，用于唯一标识每条媒体记录。
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  /**
   * 媒体URL
   *
   * 存储媒体文件的网络地址，用于访问。
   */
  @Column({ type: 'varchar', length: 255 })
  media_url: string;

  /**
   * 媒体类型
   *
   * 存储媒体类型（如：image, video）
   */
  @Column({ type: 'varchar', length: 50, default: 'image' })
  media_type: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  updated_at: Date;

  /**
   * 关联的产品实体
   */
  @ManyToOne(() => ProductEntity, (p) => p.media)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  /**
   * 关联的产品分类
   */
  @ManyToOne(() => ProductCategoryEntity, (cat) => cat.productMedia)
  @JoinColumn({ name: 'category_id' })
  category: ProductCategoryEntity;
}
