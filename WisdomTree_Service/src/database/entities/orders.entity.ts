import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { ProductEntity } from './products.entity';
import { UserEntity } from './user.entity';
import { ProductCategoryEntity } from './product_categories.entity';

/**
 * `OrderEntity` 类表示订单记录的实体。
 * 它映射到数据库中的 `orders` 表。
 */
@Entity('orders')
export class OrderEntity {
  /**
   * 订单记录的唯一标识符。
   * 使用自增长的整数，并且为无符号类型。
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // 订单编号
  @Column({ type: 'varchar', length: 100, unique: true })
  order_no: string;

  /**
   * 购买者姓名。
   */
  @Column({ type: 'varchar', length: 100 })
  buyer_name: string;

  // 联系方式
  @Column({ type: 'varchar', length: 100 })
  contact: string;

  // 收货地址
  @Column({ type: 'varchar', length: 200, nullable: true })
  address: string;

  // 区域
  @Column({ type: 'varchar', length: 100 })
  area: string;

  // 产品名称
  @Column({ type: 'varchar', length: 100 })
  product_name: string;

  // 数量
  @Column({ type: 'int', default: 1 })
  quantity: number;

  // 总金额
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_amount: number;

  // 订单状态: pending/paid/shipped/completed/cancelled
  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  // 备注
  @Column({ type: 'text', nullable: true })
  remark: string;

  /**
   * 下单日期和时间。
   */
  @CreateDateColumn({ type: 'timestamp' })
  ordered_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updated_at: Date;

  /**
   * 下单用户。
   */
  @ManyToOne(() => UserEntity, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  /**
   * 关联的产品。
   */
  @ManyToOne(() => ProductEntity, (p) => p.orders)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  /**
   * 关联的产品分类。
   */
  @ManyToOne(() => ProductCategoryEntity, (cat) => cat.orders)
  @JoinColumn({ name: 'category_id' })
  category: ProductCategoryEntity;
}
