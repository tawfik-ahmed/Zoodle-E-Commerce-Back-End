import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './user/entites/user.entity';
import { Category } from './category/entities/category.entity';
import { SubCategory } from './sub-category/entities/sub-category.entity';
import { Brand } from './brand/entites/brand.entity';
import { Coupon } from './coupon/entities/coupon.entity';
import { RequestProduct } from './request-product/entities/request-product.entity';
import { Supplier } from './supplier/entities/supplier.entity';
import { Tax } from './tax/entities/tax.entity';
import { Product } from './product/entities/product.entity';
import { ProductColor } from './product/entities/product-color.entity';
import { ProductImage } from './product/entities/product-image.entity';
import { Review } from './review/entities/review.entity';
import { Cart } from './cart/entities/cart.entity';
import { CartItem } from './cart/entities/cart-item.entity';
import { Order } from './order/entities/order.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [
    User,
    Category,
    SubCategory,
    Brand,
    Coupon,
    Supplier,
    RequestProduct,
    Tax,
    Product,
    ProductColor,
    ProductImage,
    Review,
    Cart,
    CartItem,
    Order,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});