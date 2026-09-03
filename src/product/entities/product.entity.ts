import { Category } from '../../category/entities/category.entity';
import { SubCategory } from '../../sub-category/entities/sub-category.entity';
import { Brand } from '../../brand/entites/brand.entity';
import { CURRENT_TIMESTAMP } from '../../utils/constants';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductColor } from './product-color.entity';
import { ProductImage } from './product-image.entity';
import { Review } from '../../review/entities/review.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ default: 1 })
  quantity: number;

  @Column()
  imageCover: string;

  @OneToMany(() => ProductImage, (image) => image.product)
  images: ProductImage[];

  @Column({ default: 0, nullable: true })
  sold: number;

  @Column({
    type: 'decimal',
    precision: 20,
    scale: 2,
    transformer: {
      to: (value: number) => {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      },
      from: (value: string | null) => {
        if (value === null || value === undefined) {
          return 0;
        }

        return parseFloat(value);
      },
    },
  })
  price: number;

  @Column({ default: 0, nullable: true })
  discount: number;

  @ManyToMany(() => ProductColor, (color) => color.products)
  @JoinTable()
  colors: ProductColor[];

  @Column({ default: 0, nullable: true })
  averageRating: number;

  @Column({ default: 0, nullable: true })
  ratingsQuantity: number;

  @ManyToOne(() => Category, (category) => category.products)
  category: Category;

  @ManyToOne(() => SubCategory, (subCategory) => subCategory.products)
  subCategory: SubCategory;

  @ManyToOne(() => Brand, (brand) => brand.products)
  brand: Brand;

  @Exclude()
  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @Exclude()
  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[];

  @CreateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => CURRENT_TIMESTAMP })
  updatedAt: Date;
}
