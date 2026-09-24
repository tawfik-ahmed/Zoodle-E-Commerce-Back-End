import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { UpdateSupplierDto } from './dtos/update-supplier.dto';
import { RejectSupplierDto } from './dtos/reject-supplier.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../user/decorators/roles.decorator';
import { UserRole } from '../utils/enums';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import type { JwtPayloadType } from '../utils/types';

// ~ api/v1/suppliers
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  /**
   * Get my supplier.
   */
  @Get('me')
  @Roles(UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public getMySupplier(@CurrentUser() payload: JwtPayloadType) {
    return this.supplierService.getMe(payload);
  }

  /**
   * Get all pending supplier requests.
   */
  @Get('pending')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public getPendingSuppliers() {
    return this.supplierService.getPendingSuppliers();
  }

  @Get('get-my-state')
  @Roles(UserRole.USER, UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public getMe(@CurrentUser() payload: JwtPayloadType) {
    return this.supplierService.getMyState(payload);
  }

  /**
   * Get all pending supplier update requests.
   */
  @Get('pending-updates')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public getPendingUpdates() {
    return this.supplierService.getPendingUpdates();
  }

  /**
   * Get all rejected suppliers.
   */
  @Get('rejected')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public getRejectedSuppliers() {
    return this.supplierService.getRejectedSuppliers();
  }

  /**
   * Get all approved suppliers.
   */
  @Get()
  public getAllSuppliers() {
    return this.supplierService.getAllSuppliers();
  }

  /**
   * Get supplier by id.
   */
  @Get(':id')
  public getSupplier(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.getSupplier(id);
  }
  /**
   * Supplier requests profile update.
   */
  @Patch('me')
  @Roles(UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public updateMySupplier(
    @CurrentUser() payload: JwtPayloadType,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.supplierService.updateMySupplier(payload.id, dto);
  }

  /**
   * Update supplier by id (Admin Function).
   */

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.supplierService.updateSupplier(id, dto);
  }

  /**
   * Delete supplier by id (Admin Function).
   */

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public deleteSupplier(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.deleteSupplier(id);
  }

  /**
   * Approve supplier registration.
   */
  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public approveSupplier(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.approveSupplier(id);
  }

  /**
   * Reject supplier registration.
   */
  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public rejectSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectSupplierDto,
  ) {
    return this.supplierService.rejectSupplier(id, dto.reason);
  }

  /**
   * Get supplier rejection reason.
   */
  @Get(':id/reject-reason')
  @Roles(UserRole.ADMIN, UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public getSupplierRejectionReason(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() payload: JwtPayloadType,
  ) {
    return this.supplierService.getSupplierRejectionReason(id, payload);
  }

  /**
   * Approve supplier profile update.
   */
  @Patch(':id/approve-update')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public approveSupplierUpdate(@Param('id', ParseIntPipe) id: number) {
    return this.supplierService.approveSupplierUpdate(id);
  }

  /**
   * Reject supplier profile update.
   */
  @Patch(':id/reject-update')
  @Roles(UserRole.ADMIN)
  @UseGuards(AuthGuard)
  public rejectSupplierUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectSupplierDto,
  ) {
    return this.supplierService.rejectSupplierUpdate(id, dto.reason);
  }

  /**
   * Get supplier profile update rejection reason.
   */
  @Get(':id/reject-update-reason')
  @Roles(UserRole.ADMIN, UserRole.SUPPLIER)
  @UseGuards(AuthGuard)
  public getSupplierUpdateRejectionReason(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() payload: JwtPayloadType,
  ) {
    return this.supplierService.getSupplierUpdateRejectionReason(id, payload);
  }
}
