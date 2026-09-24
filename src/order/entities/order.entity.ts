import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entites/user.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { PaymentMethod } from '../../utils/enums';
import { Exclude } from 'class-transformer';
import { CURRENT_TIMESTAMP } from '../../utils/constants';

class ShippingAddress {
  @Column({ nullable: true })
  alias?: string;

  @Column({ nullable: true })
  details?: string;

  @Column({ nullable: false })
  phone: string;

  @Column({ nullable: false })
  country: string;

  @Column({ nullable: false })
  city: string;

  @Column({ nullable: true })
  governorate?: string;

  @Column({ nullable: true })
  postalCode?: string;

  @Column({ nullable: false })
  street: string;
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  sessionId: string;

  @Exclude()
  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @OneToMany(() => CartItem, (cartItem) => cartItem.order)
  cartItems: CartItem[];

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  taxPrice: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    default: 0,

    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  shippingPrice: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    default: 0,

    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  orderPrice: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CARD,
  })
  paymentMethod: PaymentMethod;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ default: false })
  isDelivered: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  deliveredAt: Date | null;

  @Column(() => ShippingAddress)
  shippingAddress: ShippingAddress;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
  })
  createdAt: Date;
}
