import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ProductEntity } from './products.entity';
import { ContractEntity } from './contract.entity';

/**
 * `AdoptionsEntity` 类表示认领记录的实体。
 * 它映射到数据库中的 `adoptions` 表。
 *
 * 农旅产品认领：用户认领园区产品（水果/家禽等），
 * 认领下单时联动生成认养合约（contract_id）、溯源台账（trace_code）与生长日记。
 */
@Entity('adoptions')
export class AdoptionsEntity {
  /**
   * 认领记录的唯一标识符。
   * 使用自增长的整数，并且为无符号类型。
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // 认领编号
  @Column({ type: 'varchar', length: 100, unique: true })
  adoption_id: string;

  /**
   * 认领时用户的昵称。
   * 用于标识认领时用户的个性化信息。
   */
  @Column({ type: 'varchar', length: 100, nullable: true, default: '' })
  nickname: string;

  // 认领区域
  @Column({ type: 'varchar', length: 100, nullable: true, default: '' })
  area: string;

  /**
   * 认领时用户的心愿。
   * 用于记录用户在认领时填写的心愿信息。
   */
  @Column({ type: 'text', nullable: true })
  wish: string;

  /**
   * 认领状态：growing（生长中）/ harvesting（采收中）/ completed（已完成）
   */
  @Column({ type: 'varchar', length: 20, default: 'growing' })
  status: string;

  /**
   * 产品溯源二维码/溯源码（认领时自动建档生成）
   */
  @Column({ type: 'varchar', length: 32, nullable: true })
  trace_code: string;

  /**
   * 收获方式：pickup（预约采摘）/ ship（邮寄到家），未收获时为 null
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  harvest_type: string;

  /**
   * 收获信息（JSON）：预约采摘或邮寄到家的详情
   */
  @Column({ type: 'json', nullable: true })
  harvest_info: Record<string, unknown>;

  /**
   * 认领的日期和时间。
   * 表示某些认领记录可能没有记录具体的认领时间。
   */
  @CreateDateColumn({ type: 'timestamp' })
  adopted_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updated_at: Date;

  /**
   * 认领产品的用户。
   * 通过外键关联到 `UserEntity`，表示哪个用户认领了产品。
   */
  @ManyToOne(() => UserEntity, (user) => user.adoptions)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  /**
   * 被认领的产品。
   * 通过外键关联到 `ProductEntity`，表示哪个产品被认领了。
   */
  @ManyToOne(() => ProductEntity, (product) => product.adoptions)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  /**
   * 认领自动生成的认养合约（draft 草约，用户后续可去签）。
   * 通过外键关联到 `ContractEntity`。
   */
  @ManyToOne(() => ContractEntity)
  @JoinColumn({ name: 'contract_id' })
  contract: ContractEntity;
}
