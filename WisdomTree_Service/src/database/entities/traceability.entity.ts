import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('traceability_ledger')
export class TraceabilityEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 32, unique: true })
  trace_code: string;

  @Column({ type: 'int', unsigned: true, nullable: true })
  order_id: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  product_id: number;

  @Column({ type: 'varchar', length: 50, default: 'planting' })
  stage: string; // planting, growing, harvest, process, logistics

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  operator: string;

  @Column({ type: 'json', nullable: true })
  media_urls: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamp' })
  recorded_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;
}
