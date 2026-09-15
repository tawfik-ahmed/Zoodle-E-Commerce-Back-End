import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entites/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { CategoryModule } from './category/category.module';
import { Category } from './category/entities/category.entity';
import { SubCategoryModule } from './sub-category/sub-category.module';
import { BrandModule } from './brand/brand.module';
import { Brand } from './brand/entites/brand.entity';
import { CouponModule } from './coupon/coupon.module';
import { Coupon } from './coupon/entities/coupon.entity';
import { SupplierModule } from './supplier/supplier.module';
import { Supplier } from './supplier/entities/supplier.entity';
import { RequestProduct } from './request-product/entities/request-product.entity';
import { RequestProductModule } from './request-product/request-product.module';
import { TaxModule } from './tax/tax.module';
import { Tax } from './tax/entities/tax.entity';
import { ProductModule } from './product/product.module';
import { Product } from './product/entities/product.entity';
import { ProductColor } from './product/entities/product-color.entity';
import { ProductImage } from './product/entities/product-image.entity';
import { SubCategory } from './sub-category/entities/sub-category.entity';
import { ReviewModule } from './review/review.module';
import { Review } from './review/entities/review.entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { CartModule } from './cart/cart.module';
import { Cart } from './cart/entities/cart.entity';
import { CartItem } from './cart/entities/cart-item.entity';
import { OrderModule } from './order/order.module';
import { Order } from './order/entities/order.entity';
import { UploadFilesModule } from './upload-files/upload-files.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { OAuthModule } from './oauth/oauth.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          service: 'gmail',
          auth: {
            user: config.get<string>('GMAIL_USER'),
            pass: config.get<string>('GMAIL_APP_PASSWORD'),
          },
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get<string>('DATABASE_USERNAME'),
        database: config.get<string>('DATABASE_NAME'),
        password: config.get<string>('DATABASE_PASSWORD'),
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
        namingStrategy: new SnakeNamingStrategy(),
        // dropSchema: true,
        synchronize: true,
      }),
    }),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    UserModule,
    AuthModule,
    CategoryModule,
    SubCategoryModule,
    BrandModule,
    CouponModule,
    SupplierModule,
    RequestProductModule,
    TaxModule,
    ProductModule,
    ReviewModule,
    CartModule,
    OrderModule,
    UploadFilesModule,
    OAuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
