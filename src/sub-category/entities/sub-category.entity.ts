import { CURRENT_TIMESTAMP } from '../../utils/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { Product } from '../../product/entities/product.entity';
import { RequestProduct } from '../../request-product/entities/request-product.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class SubCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  image: string;

  @Exclude()
  @ManyToOne(() => Category, (category) => category.subCategories)
  category: Category;
  
  @Exclude()
  @OneToMany(
    () => RequestProduct,
    (requestProduct) => requestProduct.subCategory,
  )
  requestProducts: RequestProduct[];

  @Exclude()
  @OneToMany(() => Product, (product) => product.subCategory)
  products: Product[];

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  updatedAt: Date;
}
