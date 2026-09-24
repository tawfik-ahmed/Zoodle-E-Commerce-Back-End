import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import {
  Between,
  DataSource,
  EntityManager,
  getMetadataArgsStorage,
  In,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { ProductImage } from './entities/product-image.entity';
import { ProductColor } from './entities/product-color.entity';
import { CategoryService } from '../category/category.service';
import { SubCategoryService } from '../sub-category/sub-category.service';
import { BrandService } from '../brand/brand.service';
import { Category } from '../category/entities/category.entity';
import { SubCategory } from '../sub-category/entities/sub-category.entity';
import { Brand } from '../brand/entites/brand.entity';
import { CartItem } from '../cart/entities/cart-item.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    @InjectRepository(ProductColor)
    private readonly productColorRepository: Repository<ProductColor>,

    private readonly dataSource: DataSource,

    private readonly categoryService: CategoryService,
    private readonly subCategoryService: SubCategoryService,
    private readonly brandService: BrandService,
  ) {}

  /**
   * Creates a new product.
   *
   * @throws {BadRequestException} If product already exists.
   *
   * @param {CreateProductDto} createProductDto - Product data.
   * @returns {Promise<{ ok: boolean; data: Product; message: string }>} - Object with ok property, product data and success message.
   */
  public async createProduct(
    createProductDto: CreateProductDto,
  ): Promise<{ ok: boolean; data: Product; message: string }> {
    const {
      title,
      colors,
      images,
      categoryId,
      subCategoryId,
      brandId,
      ...rest
    } = createProductDto;

    return await this.dataSource.transaction(async (manager: EntityManager) => {
      const productRepository = manager.getRepository(Product);

      const isExists = await productRepository.exists({
        where: { title },
      });

      if (isExists) {
        throw new BadRequestException({
          ok: false,
          message: 'Product already exists',
        });
      }

      if (
        createProductDto.discount &&
        createProductDto.discount > createProductDto.price
      ) {
        throw new BadRequestException({
          ok: false,
          message: 'Discount must be less than price',
        });
      }

      const [category, subCategory, brand] =
        await this.getCategorySubCategoryBrandEntities(
          categoryId,
          subCategoryId,
          brandId,
          manager,
        );
      let colorsEntities: ProductColor[] = [];

      if (colors && colors?.length > 0) {
        await this.upsertColors(colors, manager);
        colorsEntities = await this.getColorsEntites(colors, manager);
      }

      let imagesEntities: ProductImage[] = [];

      if (images && images?.length > 0) {
        await this.upsertImages(images, manager);
        imagesEntities = await this.getImagesEntites(images, manager);
      }

      const product = productRepository.create({
        title,
        ...rest,
        category,
        subCategory,
        brand,
        images: imagesEntities,
        colors: colorsEntities,
      });
      await productRepository.save(product);

      return {
        ok: true,
        data: product,
        message: 'Product created successfully',
      };
    });
  }

  /**
   * Retrieves all products.
   *
   * @returns {Promise<{ ok: boolean, data: Product[] }>} - Object with ok property and array of product data.
   */
  public async getAllProducts(
    query: any,
  ): Promise<{ ok: boolean; data: Product[] }> {
    const {
      page,
      limit,
      sort,
      term = 'ASC',
      keyword,
      price,
      sold,
      averageRating,
      categoryId,
      subCategoryId,
      brandId,
    } = query;

    const toNumber = (value: any): number | null => {
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    const conditions: any = {};

    // keyword
    if (keyword) {
      conditions.title = Like(`%${keyword}%`);
    }

    // price
    const priceGte = toNumber(price?.gte);
    const priceLte = toNumber(price?.lte);

    if (priceGte !== null && priceLte !== null) {
      conditions.price = Between(priceGte, priceLte);
    } else if (priceGte !== null) {
      conditions.price = MoreThanOrEqual(priceGte);
    } else if (priceLte !== null) {
      conditions.price = LessThanOrEqual(priceLte);
    }

    // sold
    const soldGte = toNumber(sold?.gte);
    const soldLte = toNumber(sold?.lte);

    if (soldGte !== null && soldLte !== null) {
      conditions.sold = Between(soldGte, soldLte);
    } else if (soldGte !== null) {
      conditions.sold = MoreThanOrEqual(soldGte);
    } else if (soldLte !== null) {
      conditions.sold = LessThanOrEqual(soldLte);
    }

    // rating
    const ratingGte = toNumber(averageRating?.gte);
    const ratingLte = toNumber(averageRating?.lte);

    if (ratingGte !== null && ratingLte !== null) {
      conditions.averageRating = Between(ratingGte, ratingLte);
    } else if (ratingGte !== null) {
      conditions.averageRating = MoreThanOrEqual(ratingGte);
    } else if (ratingLte !== null) {
      conditions.averageRating = LessThanOrEqual(ratingLte);
    }

    // relations
    const category = toNumber(categoryId);
    if (category !== null) {
      conditions.category = { id: category };
    }

    const subCategory = toNumber(subCategoryId);
    if (subCategory !== null) {
      conditions.subCategory = { id: subCategory };
    }

    const brand = toNumber(brandId);
    if (brand !== null) {
      conditions.brand = { id: brand };
    }

    // sorting
    const validColumns = getMetadataArgsStorage()
      .columns.filter((col) => col.target === Product)
      .map((col) => col.propertyName);

    const order: any = {};

    if (sort && validColumns.includes(sort)) {
      const upperCaseTerm = term.toUpperCase();
      const isValidTerm = ['ASC', 'DESC'].includes(upperCaseTerm);
      order[sort] = isValidTerm ? upperCaseTerm : 'ASC';
    }

    // pagination
    const take = limit && !isNaN(limit) ? Math.min(100, Number(limit)) : 100;
    const skip =
      page && limit && !isNaN(page) && !isNaN(limit)
        ? (Number(page) - 1) * Number(limit)
        : 0;

    const products = await this.productRepository.find({
      where: conditions,
      order,
      skip,
      take,
      relations: [
        'category',
        'subCategory',
        'brand',
        'reviews',
        'reviews.user',
        'images',
        'colors',
      ],
    });
    return { ok: true, data: products };
  }

  /**
   * Retrieves a product by id.
   *
   * @param {number} id - Product id.
   * @returns {Promise<{ ok: boolean, data: Product }>} - Object with ok property and product data.
   */
  public async getProduct(id: number): Promise<{ ok: boolean; data: Product }> {
    const product = await this.getProductById(id);
    return { ok: true, data: product };
  }

  /**
   * Updates a product by id.
   *
   * @throws {BadRequestException} If product with this title already exists.
   *
   * @param {number} id - Product id.
   * @param {UpdateProductDto} updateProductDto - Product data to update.
   * @returns {Promise<{ ok: boolean, data: Product, message: string }>} - Object with ok property, product data and success message.
   */
  public async updateProduct(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<{ ok: boolean; data: Product; message: string }> {
    return await this.dataSource.transaction(async (manager: EntityManager) => {
      let product = await this.getProductById(id, manager);

      const {
        title,
        colors,
        images,
        categoryId,
        subCategoryId,
        brandId,
        ...rest
      } = updateProductDto;

      const productRepository = manager.getRepository(Product);
      let throwDiscountError = false;

      if (updateProductDto.discount) {
        if (updateProductDto.price) {
          if (updateProductDto.discount > updateProductDto.price) {
            throwDiscountError = true;
          }
        } else if (updateProductDto.discount > product.price) {
          throwDiscountError = true;
        }
      }

      if (updateProductDto.price && product.discount > updateProductDto.price) {
        throwDiscountError = true;
      }

      if (throwDiscountError) {
        throw new BadRequestException({
          ok: false,
          message: 'Discount cannot be greater than price',
        });
      }

      const [category, subCategory, brand] =
        await this.getCategorySubCategoryBrandEntities(
          categoryId ?? product.category.id,
          subCategoryId ?? product.subCategory.id,
          brandId ?? product.brand.id,
          manager,
        );

      if (colors && colors?.length > 0) {
        await this.upsertColors(colors, manager);
        product.colors = await this.getColorsEntites(colors, manager);
      }

      if (images && images?.length > 0) {
        await this.upsertImages(images, manager);
        product.images = await this.getImagesEntites(images, manager);
      }

      product = productRepository.merge(product, {
        title,
        ...rest,
        category,
        subCategory,
        brand,
      });
      await productRepository.save(product);

      return {
        ok: true,
        data: product,
        message: 'Product updated successfully',
      };
    });
  }

  /**
   * Deletes a product by id.
   *
   * @throws {BadRequestException} If product does not exist.
   *
   * @param {number} id - Product id.
   * @returns {Promise<{ ok: boolean; message: string }>} - Object with ok property and success message.
   */
  public async deleteProduct(
    id: number,
  ): Promise<{ ok: boolean; message: string }> {
    const product = await this.getProductById(id);
    await this.productRepository.remove(product);
    return { ok: true, message: 'Product deleted successfully' };
  }

  /**
   * Checks if a product with the given id exists.
   *
   * @param {number} id - Product id.
   * @returns {Promise<boolean>} - True if product exists, false otherwise.
   */
  public async isProductExistsById(id: number): Promise<boolean> {
    return await this.productRepository.exists({ where: { id } });
  }

  /**
   * Retrieves a product by id.
   *
   * @throws {BadRequestException} If product does not exist.
   *
   * @param {number} id - Product id.
   * @returns {Promise<Product>} - Product object.
   */
  public async getProductById(
    id: number,
    manager?: EntityManager,
  ): Promise<Product> {
    const repo = manager
      ? manager.getRepository(Product)
      : this.productRepository;
    const product = await repo.findOne({
      where: { id },
      relations: [
        'category',
        'subCategory',
        'brand',
        'reviews',
        'images',
        'colors',
      ],
    });

    if (!product) {
      throw new BadRequestException({
        ok: false,
        message: 'Product not found',
      });
    }

    return product;
  }

  /**
   * Retrieves a product by id without relations.
   *
   * @throws {BadRequestException} If product does not exist.
   *
   * @param {number} id - Product id.
   * @param {EntityManager} [manager] - EntityManager instance.
   * @returns {Promise<Product>} - Product object.
   */
  public async getProductByIdWithoutRelations(
    id: number,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(Product)
      : this.productRepository;

    const product = await repo.findOne({ where: { id } });

    if (!product) {
      throw new BadRequestException({
        ok: false,
        message: 'Product not found',
      });
    }

    return product;
  }

  /**
   * Adjusts the average rating and ratings quantity of a product.
   *
   * @param {number} productId - Product id.
   * @param {'add'|'update'|'delete'} type - Type of adjustment to make.
   * @param {{ oldRating?: number; newRating?: number }} data - Data to adjust the ratings with.
   * @param {EntityManager} [manager] - EntityManager instance.
   * @returns {Promise<Product>} - Updated product object.
   */
  public async adjustProductRating(
    productId: number,
    type: 'add' | 'update' | 'delete',
    data: { oldRating?: number; newRating?: number },
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(Product)
      : this.productRepository;
    const product = await this.getProductByIdWithoutRelations(
      productId,
      manager,
    );

    const oldCount = product.ratingsQuantity || 0;
    const oldAvg = product.averageRating || 0;

    let newCount = oldCount;
    let newAvg = oldAvg;

    switch (type) {
      case 'add':
        const ratingToAdd = data.newRating!;
        newCount = oldCount + 1;
        newAvg = (oldAvg * oldCount + ratingToAdd) / newCount;
        break;

      case 'update':
        if (data.oldRating == null || data.newRating == null) break;
        newAvg =
          (oldAvg * oldCount - data.oldRating + data.newRating) / oldCount;
        break;

      case 'delete':
        const ratingToDelete = data.oldRating!;
        newCount = Math.max(oldCount - 1, 0);
        newAvg =
          newCount === 0 ? 0 : (oldAvg * oldCount - ratingToDelete) / newCount;
        break;
    }

    product.ratingsQuantity = newCount;
    product.averageRating = newAvg;
    return repo.save(product);
  }

  public async processSale(cartItems: CartItem[], manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(Product)
      : this.productRepository;

    for (const item of cartItems) {
      repo.merge(item.product, {
        sold: item.product.sold + item.quantity,
        quantity: item.product.quantity - item.quantity,
      });
      await repo.save(item.product);
    }
  }

  /**
   * Retrieves category, subcategory and brand entities by their ids.
   *
   * @throws {BadRequestException} If any of the entities does not exist.
   *
   * @param {number} categoryId - Category id.
   * @param {number} subCategoryId - SubCategory id.
   * @param {number} brandId - Brand id.
   *
   * @returns {Promise<[Category, SubCategory, Brand]>} - Array with category, subcategory and brand entities.
   */
  public async getCategorySubCategoryBrandEntities(
    categoryId: number,
    subCategoryId: number,
    brandId: number,
    manager?: EntityManager,
  ): Promise<[Category, SubCategory, Brand]> {
    const [category, subCategory, brand] = await Promise.all([
      this.categoryService.getCategoryById(categoryId, manager),
      this.subCategoryService.getSubCategoryById(subCategoryId, manager),
      this.brandService.getOneBrandById(brandId, manager),
    ]);

    let missing: string[] = [];

    if (!category) {
      missing.push('Category');
    }

    if (!subCategory) {
      missing.push('SubCategory');
    }

    if (!brand) {
      missing.push('Brand');
    }

    if (!category || !subCategory || !brand) {
      throw new BadRequestException({
        ok: false,
        message: `${missing.join(', ')} not found`,
      });
    }

    return [category, subCategory, brand];
  }

  /**
   * Inserts or updates product colors in the database.
   *
   * @param {string[]} colors - Array of product color names.
   * @returns {Promise<void>} - Promise which resolves when the operation is completed.
   */
  private async upsertColors(
    colors: string[],
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(ProductColor)
      : this.productColorRepository;
    await repo.upsert(
      colors.map((color) => ({ name: color })),
      ['name'],
    );
  }

  /**
   * Retrieves product colors from the database.
   *
   * @param {string[]} colors - Array of product color names.
   * @returns {Promise<ProductColor[]>} - Promise which resolves with an array of product color entities.
   */
  private async getColorsEntites(
    colors: string[],
    manager?: EntityManager,
  ): Promise<ProductColor[]> {
    const repo = manager
      ? manager.getRepository(ProductColor)
      : this.productColorRepository;
    return repo.find({ where: { name: In(colors) } });
  }

  /**
   * Inserts or updates product images in the database.
   *
   * @param {string[]} images - Array of product image urls.
   * @returns {Promise<void>} - Promise which resolves when the operation is completed.
   */
  private async upsertImages(
    images: string[],
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(ProductImage)
      : this.productImageRepository;
    await repo.upsert(
      images.map((url) => ({ url })),
      ['url'],
    );
  }

  /**
   * Retrieves product images from the database.
   *
   * @param {string[]} images - Array of product image urls.
   * @returns {Promise<ProductImage[]>} - Promise which resolves with an array of product image entities.
   */
  private getImagesEntites(
    images: string[],
    manager?: EntityManager,
  ): Promise<ProductImage[]> {
    const repo = manager
      ? manager.getRepository(ProductImage)
      : this.productImageRepository;
    return repo.find({ where: { url: In(images) } });
  }

  /**
   * Retrieves all available product colors from the database.
   *
   * @returns {Promise<ProductColor[]>} - Promise which resolves with an array of product color entities.
   */
  public async getAvailableColors(): Promise<{ok : boolean, data : ProductColor[]}> {
    const colors = await this.productColorRepository.find({
      order: { name: 'ASC' },
    });
    return {ok : true, data : colors};
  }
}
