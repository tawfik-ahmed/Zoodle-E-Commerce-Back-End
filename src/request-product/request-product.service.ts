import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestProduct } from './entities/request-product.entity';
import { In, Repository } from 'typeorm';
import { CreateRequestProductDto } from './dtos/create-request-product.dto';
import { JwtPayloadType } from '../utils/types';
import { UpdateRequestProductDto } from './dtos/update-request-product.dto';
import { SupplierService } from '../supplier/supplier.service';
import { RequestProductStatus, UserRole } from '../utils/enums';
import { ProductService } from '../product/product.service';
import { ProductColor } from '../product/entities/product-color.entity';

@Injectable()
export class RequestProductService {
  constructor(
    @InjectRepository(RequestProduct)
    private readonly requestProductRepository: Repository<RequestProduct>,

    @InjectRepository(ProductColor)
    private readonly productColorRepository: Repository<ProductColor>,

    private readonly supplierService: SupplierService,
    private readonly productService: ProductService,
  ) {}

  /**
   * Creates a new request product.
   *
   * @throws {BadRequestException} If request product already exists.
   *
   * @param {CreateRequestProductDto} dto - Request product data.
   * @param {number} userId - User id.
   * @returns {Promise<{ ok: boolean; message: string; data: RequestProduct }>}
   */
  public async createRequestProduct(
    dto: CreateRequestProductDto,
    userId: number,
  ): Promise<{ ok: boolean; message: string; data: RequestProduct }> {
    const supplier = await this.supplierService.getSupplierByUserId(userId);

    const isExists = await this.requestProductRepository.exists({
      where: {
        title: dto.title,
        supplier: {
          id: supplier.id,
        },
      },
    });

    if (isExists) {
      throw new BadRequestException({
        ok: false,
        message: 'Request product already exists',
      });
    }

    const [category, subCategory, brand] =
      await this.productService.getCategorySubCategoryBrandEntities(
        dto.categoryId,
        dto.subCategoryId,
        dto.brandId,
      );

    const { categoryId, subCategoryId, brandId, ...rest } = dto;

    const colorEntities = dto.colorNames?.length
      ? await this.productColorRepository.findBy({ name: In(dto.colorNames) })
      : [];

    const requestProduct = this.requestProductRepository.create({
      ...rest,
      colors: colorEntities,
      supplier,
      brand,
      category,
      subCategory,
      status: RequestProductStatus.PENDING,
    });

    await this.requestProductRepository.save(requestProduct);

    return {
      ok: true,
      message: 'Request product created',
      data: requestProduct,
    };
  }

  /**
   * Retrieves all request products.
   *
   * @returns {Promise<{ ok: boolean, data: RequestProduct[] }>} - Object with ok property and array of request product data.
   */
  public async getAllRequestProducts(): Promise<{
    ok: boolean;
    data: RequestProduct[];
  }> {
    const requestProducts = await this.requestProductRepository.find({
      relations: {
        supplier: { user: true },
        category: true,
        subCategory: true,
        brand: true,
        colors: true,
      },
    });
    return { ok: true, data: requestProducts };
  }

  /**
   * Retrieves all my request products.
   *
   * @param {number} id - User id.
   * @returns {Promise<{ ok: boolean, data: RequestProduct[] }>} - Object with ok property and array of request product data.
   */
  public async getAllMyRequestProducts(id: number) {
    const supplier = await this.supplierService.getSupplierByUserId(id);
    const requestProducts = await this.requestProductRepository.find({
      where: { supplier: { id: supplier.id } },
    relations: {
      supplier: {
        user: true,
      },
      category: true,
      subCategory: true,
      brand: true,
      colors: true, 
    },
    });
    return { ok: true, data: requestProducts };
  }

  /**
   * Retrieves all pending request products.
   *
   * @returns {Promise<RequestProduct[]>} - Array of request product data.
   */
  public async getAllPendingRequestProducts(id: number) {
    const supplier = await this.supplierService.getSupplierByUserId(id);
    const requestProducts = await this.requestProductRepository.find({
      where: {
        supplier: { id: supplier.id },
        status: RequestProductStatus.PENDING,
      },
      relations: {
        supplier: true,
        category: true,
        subCategory: true,
        brand: true,
        colors: true,
      },
    });

    return { ok: true, requestProducts };
  }

  /**
   * Retrieves all approved request products.
   *
   * @returns {Promise<RequestProduct[]>} - Array of request product data.
   */
  public async getAllApprovedRequestProducts(id: number) {
    const supplier = await this.supplierService.getSupplierByUserId(id);
    const requestProducts = await this.requestProductRepository.find({
      where: {
        supplier: { id: supplier.id },
        status: RequestProductStatus.APPROVED,
      },
      relations: {
        supplier: true,
        category: true,
        subCategory: true,
        brand: true,
        colors: true,
      },
    });

    return { ok: true, requestProducts };
  }

  /**
   * Retrieves all rejected request products.
   *
   * @returns {Promise<RequestProduct[]>} - Array of request product data.
   */
  public async getAllRejectedRequestProducts(id: number) {
    const requestProducts = await this.requestProductRepository.find({
      where: {
        supplier: {
          user: {
            id,
          },
        },
        status: RequestProductStatus.REJECTED,
      },
      relations: {
        supplier: true,
        category: true,
        subCategory: true,
        brand: true,
        colors: true,
      },
    });

    return { ok: true, requestProducts };
  }

  /**
   * Retrieves a request product by id.
   *
   * @throws {UnauthorizedException} If user is not allowed to access the request product.
   *
   * @param {number} id - Request product id.
   * @param {JwtPayloadType} payload - Payload of the jwt token.
   * @returns {Promise<{ ok: boolean; data: RequestProduct }>} - Object with ok property and request product data.
   */
  public async getRequestProduct(
    id: number,
    payload: JwtPayloadType,
  ): Promise<{ ok: boolean; data: RequestProduct }> {
    const requestProduct = await this.getRequestProductById(id);
    if (
      requestProduct.supplier.user.id !== payload.id &&
      payload.role !== UserRole.ADMIN
    ) {
      throw new BadRequestException({
        ok: false,
        message: 'You are not allowed to access this request product',
      });
    }

    return { ok: true, data: requestProduct };
  }

  /**
   * Updates a request product by id.
   *
   * @throws {BadRequestException} If user is not allowed to access the request product.
   *
   * @param {number} id - Request product id.
   * @param {UpdateRequestProductDto} updateRequestProductDto - Request product data to update.
   * @param {JwtPayloadType} payload - Payload of the jwt token.
   * @returns {Promise<{ ok: boolean; message: string; data: RequestProduct }>} - Object with ok property, request product data and success message.
   */
  public async updateRequestProduct(
    id: number,
    updateRequestProductDto: UpdateRequestProductDto,
    payload: JwtPayloadType,
  ): Promise<{ ok: boolean; message: string; data: RequestProduct }> {
    const requestProduct = await this.getRequestProductById(id);

    if (requestProduct.status !== RequestProductStatus.PENDING) {
      throw new BadRequestException({
        ok: false,
        message: 'You are not allowed to update this request product',
      });
    }

    if (
      requestProduct.supplier.user.id !== payload.id &&
      payload.role !== UserRole.ADMIN
    ) {
      throw new BadRequestException({
        ok: false,
        message: 'You are not allowed to access this request product',
      });
    }

    const { colorNames, ...restDto } = updateRequestProductDto;

    let colorEntities: ProductColor[] = [];
    if (colorNames && colorNames.length > 0) {
      colorEntities = await this.productColorRepository.findBy({
        name: In(colorNames),
      });
    }

    const updatedRequestProduct = this.requestProductRepository.merge(
      requestProduct,
      restDto,
    );

    if (colorNames) {
      updatedRequestProduct.colors = colorEntities;
    }

    await this.requestProductRepository.save(updatedRequestProduct);

    return {
      ok: true,
      message: 'Request product updated successfully',
      data: updatedRequestProduct,
    };
  }

  /**
   * Deletes a request product by id.
   *
   * @throws {BadRequestException} If user is not allowed to access the request product.
   *
   * @param {number} id - Request product id.
   * @param {JwtPayloadType} payload - Payload of the jwt token.
   * @returns {Promise<{ ok: boolean; message: string }>} - Object with ok property and success message.
   */
  public async deleteRequestProduct(
    id: number,
    payload: JwtPayloadType,
  ): Promise<{ ok: boolean; message: string }> {
    const requestProduct = await this.getRequestProductById(id);
    if (
      requestProduct.supplier.user.id !== payload.id &&
      payload.role !== UserRole.ADMIN
    ) {
      throw new BadRequestException({
        ok: false,
        message: 'You are not allowed to access this request product',
      });
    }

    await this.requestProductRepository.remove(requestProduct);
    return {
      ok: true,
      message: 'Request product deleted successfully',
    };
  }

  /**
   * Retrieves a request product by id.
   *
   * @throws {NotFoundException} If request product does not exist.
   *
   * @param {number} id - Request product id.
   * @returns {Promise<RequestProduct>} - Request product data.
   */
  private async getRequestProductById(id: number): Promise<RequestProduct> {
    const requestProduct = await this.requestProductRepository.findOne({
      where: { id },
      relations: {
        supplier: {
          user: true,
        },
        category: true,
        subCategory: true,
        brand: true,
        colors: true,
      },
    });

    if (!requestProduct) {
      throw new NotFoundException({
        ok: false,
        message: 'Request product not found',
      });
    }

    return requestProduct;
  }

  /**
   * Accepts a request product by id.
   *
   * @throws {NotFoundException} If request product does not exist.
   *
   * @param {number} id - Request product id.
   * @returns {Promise<{ ok: boolean; message: string; product: Product }>} - Object with ok property, success message and product data.
   */
  public async acceptRequestProduct(requestProductId: number) {
    const requestProduct = await this.getRequestProductById(requestProductId);

    if (requestProduct.status !== RequestProductStatus.PENDING) {
      throw new BadRequestException({
        ok: false,
        message: 'You are not allowed to accept this request product',
      });
    }
    const obj = {
      title: requestProduct.title,
      description: requestProduct.description,
      quantity: requestProduct.quantity,
      price: requestProduct.price,
      imageCover: requestProduct.imageCover,
      brandId: requestProduct.brand.id,
      categoryId: requestProduct.category.id,
      subCategoryId: requestProduct.subCategory.id,
      colors: requestProduct.colors.map((color) => color.name),
    };

    const product = await this.productService.createProduct(obj);
    requestProduct.status = RequestProductStatus.APPROVED;
    await this.requestProductRepository.save(requestProduct);
    return { ok: true, message: 'Request product accepted', product: product };
  }

  /**
   * Rejects a request product by id.
   *
   * @throws {NotFoundException} If request product does not exist.
   *
   * @param {number} id - Request product id.
   * @param {string} rejectionReason - Reason for rejection.
   * @returns {Promise<{ ok: boolean; message: string }>} - Object with ok property and success message.
   */
  public async rejectRequestProduct(
    requestProductId: number,
    rejectionReason: string,
  ) {
    const requestProduct = await this.getRequestProductById(requestProductId);
    requestProduct.status = RequestProductStatus.REJECTED;
    requestProduct.rejectionReason = rejectionReason;
    await this.requestProductRepository.save(requestProduct);
    return { ok: true, message: 'Request product rejected' };
  }
}
