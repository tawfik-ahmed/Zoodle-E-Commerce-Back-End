import { Module } from '@nestjs/common';
import { RequestProductController } from './request-product.controller';
import { RequestProductService } from './request-product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestProduct } from './entities/request-product.entity';
import { UserModule } from '../user/user.module';
import { SupplierModule } from '../supplier/supplier.module';
import { ProductModule } from '../product/product.module';
import { ProductColor } from '../product/entities/product-color.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestProduct, ProductColor]),
    UserModule,
    ProductModule,
    SupplierModule,
  ],
  controllers: [RequestProductController],
  providers: [RequestProductService],
  exports: [],
})
export class RequestProductModule {}
