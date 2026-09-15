import { Product } from '../../product/entities/product.entity'; 
import { User } from '../../user/entites/user.entity'; 
import { CURRENT_TIMESTAMP } from '../../utils/constants'; 
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Review {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  productId: number;

  @Column({ type: 'text', nullable: true })
  reviewText?: string;

  @Column({ type: 'int' })
  rating: number;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  updatedAt: Date;
}
