import { CURRENT_TIMESTAMP } from '../../utils/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entites/user.entity';
import { RequestProduct } from '../../request-product/entities/request-product.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  companyName: string;

  @Column({ unique: true })
  website: string;

  @Column({ default: false })
  isApproved: boolean;

  @Exclude()
  @Column({ nullable: true })
  pendingCompanyName: string;

  @Exclude()
  @Column({ nullable: true })
  pendingWebsite: string;

  @Exclude()
  @Column({ default: false })
  hasPendingUpdate: boolean;

  @Exclude()
  @Column({ nullable: true })
  rejectionReason: string;

  @Exclude()
  @OneToOne(() => User, (user) => user.supplier, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @Exclude()
  @OneToMany(() => RequestProduct, (requestProduct) => requestProduct.supplier)
  requestProducts: RequestProduct[];

  @CreateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
  })
  updatedAt: Date;
}
