import { Exclude } from 'class-transformer';
import { CURRENT_TIMESTAMP } from '../../utils/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserGender, UserRole } from '../../utils/enums';
import { Review } from '../../review/entities/review.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { Order } from '../../order/entities/order.entity';
import { Supplier } from '../../supplier/entities/supplier.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true })
  age: number;

  @Column({ type: 'enum', enum: UserGender, nullable: true })
  gender: UserGender;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  @Exclude()
  emailVerificationTokenExpiresAt: Date;

  @Column({ nullable: true })
  @Exclude()
  verificationCode: string;

  @Column({ default: false })
  @Exclude()
  isCodeVerified: boolean;

  @Exclude()
  @OneToOne(() => Supplier, (supplier) => supplier.user)
  supplier: Supplier;

  @Exclude()
  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @Exclude()
  @OneToOne(() => Cart, (cart) => cart.user)
  cart: Cart;

  @Exclude()
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

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
