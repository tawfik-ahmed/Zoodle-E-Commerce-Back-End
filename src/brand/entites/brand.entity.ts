import { Exclude } from 'class-transformer';
import { Product } from '../../product/entities/product.entity';
import { RequestProduct } from '../../request-product/entities/request-product.entity';
import { CURRENT_TIMESTAMP } from '../../utils/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Brand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  image: string;

  @Exclude()
  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];

  @Exclude()
  @OneToMany(() => RequestProduct, (requestProduct) => requestProduct.brand)
  requestProducts: RequestProduct[];

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  updatedAt: Date;
}
