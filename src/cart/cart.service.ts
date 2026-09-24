import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCartDto } from './dtos/create-cart.dto';
import { UpdateCartDto } from './dtos/update-cart.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { UserService } from '../user/user.service';
import { ProductService } from '../product/product.service';
import { Product } from '../product/entities/product.entity';
import { JwtPayloadType } from '../utils/types';
import { UserRole } from '../utils/enums';
import { CouponService } from '../coupon/coupon.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,

    private readonly userService: UserService,
    private readonly productService: ProductService,
    @Inject(forwardRef(() => CouponService))
    private readonly couponService: CouponService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a new cart item.
   *
   * @param {CreateCartDto} createCartDto - Object containing cart item data to create.
   * @param {number} productId - Product id.
   * @param {number} userId - User id.
   * @returns {Promise<{ ok: boolean; data: CartItem, message: string }>} - Object with ok property and cart item data.
   */
  public async createCartItem(
    createCartDto: CreateCartDto,
    productId: number,
    userId: number,
  ) {
    const { quantity } = createCartDto;
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const cartRepo = manager.getRepository(Cart);
      const cartItemRepo = manager.getRepository(CartItem);

      const product = await this.productService.getProductByIdWithoutRelations(
        productId,
        manager,
      );

      if (quantity > product.quantity) {
        throw new BadRequestException({
          ok: false,
          message:
            'Product quantity is less than the quantity you want to add to cart',
        });
      }

      const productPrice = this.getPriceAfterDiscount(product);
      let cart = await this.getCartByUserId(userId, manager);
      let cartItem;

      if (!cart) {
        cart = cartRepo.create({ user: { id: userId } });
        await cartRepo.save(cart);
        cartItem = cartItemRepo.create({
          cart,
          product,
          quantity,
          price: productPrice * quantity,
        });
        cart.totalPrice = Number(product.price) * quantity;
        cart.totalPriceAfterDiscount = productPrice * quantity;
        await cartItemRepo.save(cartItem);
        await cartRepo.save(cart);
      } else {
        cartItem = await this.getCartItem(cart.id, product.id, manager);
        if (cartItem) {
          cart.totalPrice -= Number(product.price) * cartItem.quantity;
          cart.totalPriceAfterDiscount -= cartItem.price;

          cartItem.quantity = quantity;
          cartItem.price = productPrice * quantity;

          cart.totalPrice += Number(product.price) * quantity;
          cart.totalPriceAfterDiscount += productPrice * quantity;
        } else {
          cartItem = cartItemRepo.create({
            cart,
            product,
            quantity,
            price: productPrice * quantity,
          });
          cart.totalPrice += Number(product.price) * quantity;
          cart.totalPriceAfterDiscount += productPrice * quantity;
        }

        await cartRepo.save(cart);
        await cartItemRepo.save(cartItem);
        cartItem = await this.getCartItemById(cartItem.id, manager);
      }

      return { ok: true, data: cartItem, message: 'Cart item created' };
    });
  }

  /**
   * Updates a cart item by id.
   *
   * @throws {BadRequestException} If quantity is less than or equal to 0.
   * @throws {BadRequestException} If cart item is not found.
   * @throws {BadRequestException} If product quantity is less than the quantity you want to update to cart.
   *
   * @param {UpdateCartDto} updateCartDto - Cart item data to update.
   * @param {number} itemId - Cart item id.
   * @param {number} userId - User id.
   * @returns {Promise<{ ok: boolean, data: CartItem, message: string }>} - Object with ok property, cart item data and success message.
   */
  public async updateCartItem(
    itemId: number,
    payload: JwtPayloadType,
    updateCartDto: UpdateCartDto,
  ) {
    const { id: userId, role } = payload;
    const { quantity } = updateCartDto;

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const cartItemRepo = manager.getRepository(CartItem);
      const cartRepo = manager.getRepository(Cart);
      const cartItem = await cartItemRepo.findOne({
        where: { id: itemId },
        relations: ['cart', 'product', 'cart.user'],
      });

      if (!cartItem) {
        throw new BadRequestException('Cart item not found');
      }

      if (quantity > cartItem.product.quantity) {
        throw new BadRequestException('Not enough stock');
      }

      const cart = cartItem.cart;

      if (!cart) {
        throw new BadRequestException('Cart not found');
      }

      if (role !== UserRole.ADMIN && cart?.user?.id !== userId) {
        throw new ForbiddenException('You are not allowed to update this cart');
      }

      const product = cartItem.product;
      const productPrice = this.getPriceAfterDiscount(product);

      cart.totalPrice -= Number(product.price) * cartItem.quantity;
      cart.totalPriceAfterDiscount -= cartItem.price;

      cartItem.quantity = quantity;
      cartItem.price = productPrice * quantity;

      cart.totalPrice += Number(product.price) * quantity;
      cart.totalPriceAfterDiscount += productPrice * quantity;

      await cartItemRepo.save(cartItem);
      await cartRepo.save(cart);

      return { ok: true, data: cartItem, message: 'Updated successfully' };
    });
  }

  /**
   * Removes a cart item by its id and user id.
   *
   * @param {number} itemId - Cart item id.
   * @param {number} userId - User id.
   * @returns {Promise<{ ok: boolean, message: string }>} - Object with ok property and success message.
   * @throws {BadRequestException} If cart item is not found.
   */
  public async deleteCartItem(itemId: number, payload: JwtPayloadType) {
    const { id: userId, role } = payload;

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const cartRepo = manager.getRepository(Cart);
      const cartItemRepo = manager.getRepository(CartItem);

      const cartItem = await cartItemRepo.findOne({
        where: { id: itemId },
        relations: ['cart', 'cart.user', 'product'],
      });

      if (!cartItem) {
        throw new BadRequestException({
          ok: false,
          message: 'Cart item not found',
        });
      }

      const cart = cartItem.cart;

      if (!cart) {
        throw new BadRequestException('Cart not found');
      }

      if (role !== UserRole.ADMIN && cart.user.id !== userId) {
        throw new ForbiddenException('You are not allowed to delete this cart');
      }

      const product = cartItem.product;

      cart.totalPrice -= Number(product.price) * cartItem.quantity;
      cart.totalPriceAfterDiscount -= cartItem.price;

      await cartItemRepo.delete(itemId);
      await cartRepo.save(cart);

      return { ok: true, message: 'Cart item deleted successfully' };
    });
  }

  /**
   * Retrieves a cart by user id.
   *
   * @param {number} userId - User id.
   * @returns {Promise<{ ok: boolean, data: Cart }>} - Object with ok property and cart data.
   */
  public async getCart(userId: number) {
    const cart = await this.getCartByUserId(userId);
    return { ok: true, data: cart };
  }

  /**
   * Applies a coupon to the user's cart.
   *
   * @param {string} couponName - Name of the coupon to apply.
   * @param {JwtPayloadType} payload - User payload containing user id.
   * @returns {Promise<{ ok: boolean, data: Cart, message: string }>} - Object with ok property, cart data and success message.
   * @throws {BadRequestException} If coupon is expired, cart not found, or coupon already applied.
   */
  public async ApplyCoupons(couponName: string, payload: JwtPayloadType) {
    const { id: userId } = payload;

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const cartRepo = manager.getRepository(Cart);

      const coupon = await this.couponService.getOneCouponByName(
        couponName,
        manager,
      );

      if (coupon.expireDate && coupon.expireDate < new Date()) {
        throw new BadRequestException('Coupon is expired');
      }

      const userCart = await this.getCartByUserId(userId, manager);

      if (!userCart) {
        throw new BadRequestException('Cart not found');
      }

      userCart.coupons = userCart.coupons || [];

      const isAlreadyApplied = userCart.coupons.some(
        (c) => c.name === coupon.name,
      );

      if (isAlreadyApplied) {
        throw new BadRequestException('Coupon already applied');
      }

      userCart.coupons.push(coupon);

      userCart.totalPriceAfterDiscount = Math.max(
        0,
        userCart.totalPriceAfterDiscount - coupon.discount,
      );

      await cartRepo.save(userCart);
      return {
        ok: true,
        data: userCart,
        message: 'Coupon applied successfully',
      };
    });
  }

  /**
   * Retrieves a cart item by cart id and product id.
   *
   * @param {number} cartId - Cart id.
   * @param {number} productId - Product id.
   * @param {EntityManager} [manager] - EntityManager instance.
   * @returns {Promise<CartItem>} - Cart item object.
   * @throws {NotFoundException} If cart item is not found.
   */
  public async getCartItem(
    cartId: number,
    productId: number,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(CartItem)
      : this.cartItemRepository;
    return repo.findOne({
      where: { cart: { id: cartId }, product: { id: productId } },
      relations: ['product'],
    });
  }

  /**
   * Resets a cart by cart id.
   *
   * @param {number} userId - User id.
   * @param {EntityManager} [manager] - EntityManager instance.
   * @returns {Promise<Cart>} - Cart object.
   * @throws {BadRequestException} If cart is not found.
   */
  public async resetCart(userId: number, manager?: EntityManager) {
    const cartRepo = manager
      ? manager.getRepository(Cart)
      : this.cartRepository;

    const cart = await this.getCartByUserId(userId, manager);

    if (!cart) {
      throw new BadRequestException('Cart not found');
    }

    cart.totalPrice = 0;
    cart.totalPriceAfterDiscount = 0;
    cart.items = [];

    await cartRepo.save(cart);
    return cart;
  }

  /**
   * Retrieves a cart by user id.
   *
   * @param {number} userId - User id.
   * @param {EntityManager} [manager] - EntityManager instance.
   * @returns {Promise<Cart>} - Cart object.
   */
  public async getCartByUserId(userId: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Cart) : this.cartRepository;
    const cart = await repo.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.product.images', 'coupons'],
    });

    return cart;
  }

  /**
   * Retrieves a cart item by id and user id.
   *
   * @param {number} itemId - Cart item id.
   * @param {number} userId - User id.
   * @param {EntityManager} [manager] - EntityManager instance.
   * @returns {Promise<CartItem>} - Cart item object.
   * @throws {NotFoundException} If cart item is not found.
   */
  public async getCartItemById(itemId: number, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(CartItem)
      : this.cartItemRepository;
    return repo.findOne({
      where: { id: itemId },
      relations: ['product'],
    });
  }

  /**
   * Retrieves a cart by cart itemid.
   *
   * @param {number} itemId - CartItem id.
   * @param {EntityManager} [manager] - EntityManager instance.
   * @returns {Promise<Cart>} - Cart object.
   * @throws {NotFoundException} If cart is not found.
   */
  public async getCartByItemId(itemId: number, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Cart) : this.cartRepository;
    const cart = await repo.findOne({
      where: { items: { id: itemId } },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return cart;
  }

  /**
   * Returns the price of a product after discount has been applied.
   *
   * @param {Product} product - Product object.
   * @returns {number} - Price of the product after discount.
   */
  public getPriceAfterDiscount(product: Product) {
    const price = Number(product.price);
    const discount = product.discount || 0;
    return Math.max(0, price - discount);
  }
}
