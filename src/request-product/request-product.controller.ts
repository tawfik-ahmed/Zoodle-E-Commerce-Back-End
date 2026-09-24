import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RequestProductService } from './request-product.service';
import { Roles } from '../user/decorators/roles.decorator';
import { UserRole } from '../utils/enums';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateRequestProductDto } from './dtos/create-request-product.dto';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import type { JwtPayloadType } from '../utils/types';
import { UpdateRequestProductDto } from './dtos/update-request-product.dto';
import { RejectRequestProductDto } from './dtos/reject-request-product.dto';

// ~api/v1/request-products
@Controller('request-products')
export class RequestProductController {
  constructor(private readonly requestProductService: RequestProductService) {}

  @Post()
  @Roles(UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public create(
    @Body() createRequestProductDto: CreateRequestProductDto,
    @CurrentUser() payload: JwtPayloadType,
  ) {
    return this.requestProductService.createRequestProduct(
      createRequestProductDto,
      payload.id,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public findAll() {
    return this.requestProductService.getAllRequestProducts();
  }

  @Get('approved-request-products')
  @Roles(UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public getAcceptedRequestProducts(@CurrentUser() payload: JwtPayloadType) {
    return this.requestProductService.getAllApprovedRequestProducts(payload.id);
  }

  @Get('pending-request-products')
  @Roles(UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public getPendingRequestProducts(@CurrentUser() payload: JwtPayloadType) {
    return this.requestProductService.getAllPendingRequestProducts(payload.id);
  }

  @Get('rejected-request-products')
  @Roles(UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public getRejectedRequestProducts(@CurrentUser() payload: JwtPayloadType) {
    return this.requestProductService.getAllRejectedRequestProducts(payload.id);
  }

  @Get('my-requests')
  @Roles(UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public getMyRequestProducts(@CurrentUser() payload: JwtPayloadType) {
    return this.requestProductService.getAllMyRequestProducts(payload.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() payload: JwtPayloadType,
  ) {
    return this.requestProductService.getRequestProduct(id, payload);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRequestProductDto: UpdateRequestProductDto,
    @CurrentUser() payload: JwtPayloadType,
  ) {
    return this.requestProductService.updateRequestProduct(
      id,
      updateRequestProductDto,
      payload,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() payload: JwtPayloadType,
  ) {
    return this.requestProductService.deleteRequestProduct(id, payload);
  }

  @Post('accept/:id')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public acceptRequestProduct(@Param('id', ParseIntPipe) id: number) {
    return this.requestProductService.acceptRequestProduct(id);
  }

  @Post('reject/:id')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public rejectRequestProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectRequestProductDto,
  ) {
    return this.requestProductService.rejectRequestProduct(
      id,
      dto.rejectionReason,
    );
  }
}
