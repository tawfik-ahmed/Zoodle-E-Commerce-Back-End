import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { UpdateCouponDto } from './dtos/update-coupon.dto';
import { Roles } from '../user/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UserRole } from '../utils/enums';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import type { JwtPayloadType } from '../utils/types';

// ~api/v1/coupons
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponService.createCoupon(createCouponDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public findAll() {
    return this.couponService.getAllCoupons();
  }

  @Get('available')
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public findAllAvailable(@CurrentUser() payload: JwtPayloadType) {
    return this.couponService.getAllAvailableCoupons(payload);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER, UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public findOne(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.getOneCoupon(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.couponService.updateCoupon(id, updateCouponDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public remove(@Param('id', ParseIntPipe) id: number) {
    return this.couponService.deleteCoupon(id);
  }
}
