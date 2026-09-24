import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Supplier } from './entities/supplier.entity';
import { UpdateSupplierDto } from './dtos/update-supplier.dto';
import { User } from '../user/entites/user.entity';
import { SupplierStatus, UserRole } from '../utils/enums';
import { JwtPayloadType } from '../utils/types';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Retrieves all suppliers.
   *
   * @returns {Promise<{ ok: boolean; data: Supplier[] }>} - Object with ok property and supplier data.
   */
  public async getAllSuppliers(): Promise<{
    ok: boolean;
    data: Supplier[];
  }> {
    const suppliers = await this.supplierRepository.find({
      where: {
        isApproved: true,
      },
      relations: {
        user: true,
      },
    });

    return {
      ok: true,
      data: suppliers,
    };
  }

  /**
   * Retrieves a supplier by id.
   *
   * @throws {NotFoundException} If supplier does not exist.
   *
   * @param {number} id - Supplier id.
   *
   * @returns {Promise<{ ok: boolean; data: Supplier[] }>} - Object with ok property and supplier data.
   */
  private async getSupplierById(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: {
        id,
      },
      relations: {
        user: true,
      },
    });

    if (!supplier) {
      throw new NotFoundException({
        ok: false,
        message: 'Supplier not found',
      });
    }

    return supplier;
  }

  public getMe(payload: JwtPayloadType) {
    return this.getSupplierByUserId(payload.id);
  }

  /**
   * Retrieves a supplier by user id.
   *
   * @throws {NotFoundException} If supplier does not exist.
   *
   * @param {number} userId - User id.
   *
   * @returns {Promise<{ ok: boolean; data: Supplier[] }>} - Object with ok property and supplier data.
   */
  public async getSupplierByUserId(userId: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
      relations: {
        user: true,
      },
    });

    if (!supplier || !supplier.isApproved) {
      throw new NotFoundException({
        ok: false,
        message: 'Supplier not found',
      });
    }

    return supplier;
  }
  /**
   * Retrieves a supplier by id.
   *
   * @throws {NotFoundException} If supplier does not exist.
   *
   * @param {number} id - Supplier id.
   * @returns {Promise<{ ok: boolean; data: Supplier }>} - Object with ok property and supplier data.
   */
  public async getSupplier(id: number) {
    const supplier = await this.getSupplierById(id);

    if (!supplier.isApproved) {
      throw new NotFoundException({
        ok: false,
        message: 'Supplier not found',
      });
    }
    return {
      ok: true,
      data: supplier,
    };
  }

  public async getMyState(payload: JwtPayloadType): Promise<{
    ok: boolean;
    data: { status: string; rejectionReason: string };
  }> {
    const supplier = await this.supplierRepository.findOne({
      where: {
        user: {
          id: payload.id,
        },
      },
      relations: {
        user: true,
      },
    });

    if (!supplier) {
      throw new NotFoundException({
        ok: false,
        message: 'Supplier not found',
      });
    }

    return {
      ok: true,
      data: {
        status: supplier.status,
        rejectionReason: supplier.rejectionReason,
      },
    };
  }

  /**
   * Updates a supplier by id.
   *
   * @throws {NotFoundException} If supplier does not exist.
   *
   * @param {number} id - Supplier id.
   * @param {UpdateSupplierDto} updateSupplierDto - Supplier data.
   * @returns {Promise<{ ok: boolean; message: string; data: Supplier }>} - Object with ok property, supplier data and success message.
   */
  public async updateSupplier(id: number, dto: UpdateSupplierDto) {
    const supplier = await this.getSupplierById(id);

    if (!supplier.isApproved) {
      throw new BadRequestException({
        ok: false,
        message: 'Your account is not approved yet',
      });
    }

    this.supplierRepository.merge(supplier, dto);
    await this.supplierRepository.save(supplier);

    return {
      ok: true,
      message: 'Supplier updated successfully',
      data: supplier,
    };
  }

  public async deleteSupplier(id: number) {
    const supplier = await this.getSupplierById(id);
    const user = await this.userRepository.findOne({
      where: { id: supplier.user.id },
    });

    if (!user) {
      throw new NotFoundException({ ok: false, message: 'User not found' });
    }

    user.role = UserRole.USER;

    await this.userRepository.save(user);
    await this.supplierRepository.remove(supplier);

    return {
      ok: true,
      message: 'Supplier deleted successfully',
    };
  }
  /**
   * Updates a supplier by id.
   *
   * @throws {NotFoundException} If supplier does not exist.
   *
   * @param {number} id - Supplier id.
   * @param {UpdateSupplierDto} updateSupplierDto - Supplier data.
   * @returns {Promise<{ ok: boolean; message: string; data: Supplier }>} - Object with ok property, supplier data and success message.
   */
  public async updateMySupplier(userId: number, dto: UpdateSupplierDto) {
    if (!dto.companyName && !dto.website) {
      throw new BadRequestException({
        ok: false,
        message: 'Nothing to update',
      });
    }
    const supplier = await this.supplierRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
      relations: {
        user: true,
      },
    });

    if (!supplier) {
      throw new NotFoundException({
        ok: false,
        message: 'Supplier not found',
      });
    }

    if (!supplier.isApproved) {
      throw new BadRequestException({
        ok: false,
        message: 'Your account is not approved yet',
      });
    }

    if (supplier.hasPendingUpdate) {
      throw new BadRequestException({
        ok: false,
        message: 'You already have a pending update request',
      });
    }

    if (dto.companyName) {
      const companyExists = await this.supplierRepository.exists({
        where: {
          companyName: dto.companyName,
        },
      });

      if (companyExists && dto.companyName !== supplier.companyName) {
        throw new BadRequestException({
          ok: false,
          message: 'Company name already exists',
        });
      }
    }

    if (dto.website) {
      const websiteExists = await this.supplierRepository.exists({
        where: {
          website: dto.website,
        },
      });

      if (websiteExists && dto.website !== supplier.website) {
        throw new BadRequestException({
          ok: false,
          message: 'Website already exists',
        });
      }
    }

    supplier.pendingCompanyName = dto.companyName ?? supplier.companyName;
    supplier.pendingWebsite = dto.website ?? supplier.website;
    supplier.hasPendingUpdate = true;
    supplier.rejectionReason = null!;

    await this.supplierRepository.save(supplier);

    return {
      ok: true,
      message: 'Update request sent successfully',
      data: supplier,
    };
  }

  /**
   * Approves a supplier by id.
   *
   * @throws {NotFoundException} If supplier does not exist.
   * @throws {BadRequestException} If supplier is already approved.
   *
   * @param {number} id - Supplier id.
   * @returns {Promise<{ ok: boolean; message: string; data: Supplier }>} - Object with ok property, supplier data and success message.
   */
  public async approveSupplier(id: number) {
    const supplier = await this.getSupplierById(id);

    if (supplier.isApproved) {
      throw new BadRequestException({
        ok: false,
        message: 'Supplier already approved',
      });
    }

    supplier.user.role = UserRole.SUPPLIER;

    supplier.rejectionReason = null!;
    supplier.pendingCompanyName = null!;
    supplier.pendingWebsite = null!;
    supplier.hasPendingUpdate = false;
    supplier.isApproved = true;
    supplier.status = SupplierStatus.APPROVED;

    await this.userRepository.save(supplier.user);
    await this.supplierRepository.save(supplier);

    return {
      ok: true,
      message: 'Supplier approved successfully',
      data: supplier,
    };
  }

  /**
   * Rejects a supplier by id.
   *
   * @throws {NotFoundException} If supplier does not exist.
   *
   * @param {number} id - Supplier id.
   * @param {string} [reason] - Reason for rejection.
   * @returns {Promise<{ ok: boolean; message: string; data: Supplier }>} - Object with ok property, supplier data and success message.
   */
  public async rejectSupplier(id: number, reason?: string) {
    const supplier = await this.getSupplierById(id);

    if (supplier.isApproved) {
      throw new BadRequestException({
        ok: false,
        message: 'Supplier already approved',
      });
    }

    supplier.status = SupplierStatus.REJECTED;
    supplier.rejectionReason = reason ?? 'Supplier request rejected';

    await this.supplierRepository.save(supplier);

    return {
      ok: true,
      message: 'Supplier request rejected successfully',
      data: supplier,
    };
  }

  /**
   * Retrieves all rejected suppliers.
   *
   * @returns {Promise<{ ok: boolean; data: Supplier[] }>} - Object with ok property and supplier data.
   */
  public async getRejectedSuppliers() {
    const suppliers = await this.supplierRepository.find({
      where: {
        status: SupplierStatus.REJECTED,
      },
      relations: {
        user: true,
      },
    });

    return {
      ok: true,
      data: suppliers,
    };
  }
  /**
   * Retrieves the rejection reason for a supplier by id.
   *
   * @throws {NotFoundException} If supplier does not exist.
   * @throws {BadRequestException} If user is not authorized to view the supplier.
   *
   * @param {number} id - Supplier id.
   * @param {JwtPayloadType} payload - JWT payload.
   * @returns {Promise<{ ok: boolean; message: string; data: string }>} - Object with ok property, rejection reason and success message.
   */
  public async getSupplierRejectionReason(id: number, payload: JwtPayloadType) {
    const supplier = await this.getSupplierById(id);
    if (payload.role !== UserRole.ADMIN && supplier.user.id !== payload.id) {
      throw new BadRequestException({
        ok: false,
        message: 'You are not authorized to view this supplier',
      });
    }

    return {
      ok: true,
      message: 'Supplier rejection reason fetched successfully',
      data: supplier.rejectionReason,
    };
  }

  /**
   * Approves a supplier update by id.
   *
   * @throws {NotFoundException} If supplier does not exist.
   * @throws {BadRequestException} If supplier has no pending update.
   *
   * @param {number} id - Supplier id.
   * @returns {Promise<{ ok: boolean; message: string; data: Supplier }>} - Object with ok property, supplier data and success message.
   */
  public async approveSupplierUpdate(id: number) {
    const supplier = await this.getSupplierById(id);

    if (!supplier.hasPendingUpdate) {
      throw new BadRequestException({
        ok: false,
        message: 'No pending update found',
      });
    }

    supplier.companyName = supplier.pendingCompanyName!;
    supplier.website = supplier.pendingWebsite!;

    supplier.pendingCompanyName = null!;
    supplier.pendingWebsite = null!;
    supplier.hasPendingUpdate = false;
    supplier.rejectionReason = null!;

    await this.supplierRepository.save(supplier);

    return {
      ok: true,
      message: 'Supplier update approved successfully',
      data: supplier,
    };
  }
  /**
   * Rejects a supplier update by id.
   *
   * @throws {NotFoundException} If supplier does not exist.
   * @throws {BadRequestException} If supplier has no pending update.
   *
   * @param {number} id - Supplier id.
   * @param {string} [reason] - Reason for rejection.
   * @returns {Promise<{ ok: boolean; message: string; data: Supplier }>} - Object with ok property, supplier data and success message.
   */
  public async rejectSupplierUpdate(id: number, reason?: string) {
    const supplier = await this.getSupplierById(id);

    if (!supplier.hasPendingUpdate) {
      throw new BadRequestException({
        ok: false,
        message: 'No pending update found',
      });
    }

    supplier.pendingCompanyName = null!;
    supplier.pendingWebsite = null!;

    supplier.hasPendingUpdate = false;
    supplier.rejectionReason = reason ?? 'Supplier update rejected';

    await this.supplierRepository.save(supplier);

    return {
      ok: true,
      message: 'Supplier update rejected successfully',
      data: supplier,
    };
  }

  /**
   * Retrieves the rejection reason for a supplier update by id.
   *
   * @throws {NotFoundException} If supplier does not exist.
   * @throws {BadRequestException} If user is not authorized to view the supplier.
   *
   * @param {number} id - Supplier id.
   * @param {JwtPayloadType} payload - JWT payload.
   * @returns {Promise<{ ok: boolean; message: string; data: string }>} - Object with ok property, rejection reason and success message.
   */
  public async getSupplierUpdateRejectionReason(
    id: number,
    payload: JwtPayloadType,
  ) {
    const supplier = await this.getSupplierById(id);
    if (payload.role !== UserRole.ADMIN && supplier.user.id !== payload.id) {
      throw new BadRequestException({
        ok: false,
        message: 'You are not authorized to view this supplier',
      });
    }

    return {
      ok: true,
      message: 'Supplier update rejection reason fetched successfully',
      data: supplier.rejectionReason,
    };
  }

  /**
   * Retrieves all pending suppliers.
   *
   * @returns {Promise<{ ok: boolean; data: Supplier[] }>} - Object with ok property and supplier data.
   */
  public async getPendingSuppliers() {
    const suppliers = await this.supplierRepository.find({
      where: {
        status: SupplierStatus.PENDING,
      },
      relations: {
        user: true,
      },
    });

    return {
      ok: true,
      data: suppliers,
    };
  }

  /**
   * Retrieves all pending updates.
   *
   * @returns {Promise<{ ok: boolean; data: Supplier[] }>} - Object with ok property and supplier data.
   */
  public async getPendingUpdates() {
    const suppliers = await this.supplierRepository.find({
      where: {
        hasPendingUpdate: true,
      },
      relations: {
        user: true,
      },
    });

    return {
      ok: true,
      data: suppliers,
    };
  }
}
