import { CURRENT_TIMESTAMP } from '../../utils/constants';
import { Cart } from '../../cart/entities/cart.entity'; 
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'timestamp' })
  expireDate: Date;

  @Column()
  discount: number;

    @Exclude()
  
  @ManyToMany(() => Cart, (cart) => cart.coupons)
  carts: Cart[];

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  updatedAt: Date;
}
