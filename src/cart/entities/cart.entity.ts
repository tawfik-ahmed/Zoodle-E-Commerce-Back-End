import { Coupon } from '../../coupon/entities/coupon.entity';
import { User } from '../../user/entites/user.entity';
import { CURRENT_TIMESTAMP } from '../../utils/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartItem } from './cart-item.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
    default: 0,
  })
  totalPrice: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
    default: 0,
  })
  totalPriceAfterDiscount: number;

  @Exclude()
  @OneToOne(() => User, (user) => user.cart)
  @JoinColumn()
  user: User;

  @ManyToMany(() => Coupon, (coupon) => coupon.carts)
  @JoinTable()
  coupons: Coupon[];

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  updatedAt: Date;
}
