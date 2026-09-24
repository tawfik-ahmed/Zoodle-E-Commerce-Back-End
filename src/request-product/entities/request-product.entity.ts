import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CURRENT_TIMESTAMP } from '../../utils/constants';
import { RequestProductStatus } from '../../utils/enums';
import { Supplier } from '../../supplier/entities/supplier.entity';
import { Brand } from '../../brand/entites/brand.entity';
import { SubCategory } from '../../sub-category/entities/sub-category.entity';
import { Category } from '../../category/entities/category.entity';
import { ProductColor } from '../../product/entities/product-color.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class RequestProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  imageCover: string;

  @Column()
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    transformer: {
      to: (value: number) => Number(value),
      from: (value: string) => parseFloat(value),
    },
  })
  price: number;

  @Column({ default: 0 })
  discount: number;

  @ManyToMany(() => ProductColor)
  @JoinTable()
  colors: ProductColor[];

  @Exclude()
  @ManyToOne(() => Category, (category) => category.requestProducts)
  category: Category;

  @Exclude()
  @ManyToOne(() => SubCategory, (subCategory) => subCategory.requestProducts)
  subCategory: SubCategory;

  @Exclude()
  @ManyToOne(() => Brand, (brand) => brand.requestProducts)
  brand: Brand;

  @Exclude()
  @ManyToOne(() => Supplier, (supplier) => supplier.requestProducts, {
    onDelete: 'CASCADE',
  })
  supplier: Supplier;

  @Column({
    type: 'enum',
    enum: RequestProductStatus,
    default: RequestProductStatus.PENDING,
  })
  status: RequestProductStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  updatedAt: Date;
}
