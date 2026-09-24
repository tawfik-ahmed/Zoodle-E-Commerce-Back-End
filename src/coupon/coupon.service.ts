import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCouponDto } from './dtos/create-coupon.dto';
import { UpdateCouponDto } from './dtos/update-coupon.dto';
import { EntityManager, In, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtPayloadType } from '../utils/types';
import { CartService } from '../cart/cart.service';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,

    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,

    private readonly entityManager: EntityManager,
  ) {}

  /**
   * Create a new coupon
   * @param {CreateCouponDto} createCouponDto - coupon data
   * @throws {BadRequestException} if coupon already exists
   * @returns {Promise<{ ok: boolean; message: string; data: Coupon }>}
   */
  public async createCoupon(createCouponDto: CreateCouponDto) {
    const isExists = await this.couponRepository.exists({
      where: { name: createCouponDto.name },
    });

    if (isExists) {
      throw new BadRequestException({
        ok: false,
        message: 'Coupon already exists',
      });
    }

    const coupoun = this.couponRepository.create(createCouponDto);
    await this.couponRepository.save(coupoun);
    return { ok: true, message: 'Coupon created successfully', data: coupoun };
  }

  /**
   * Retrieves all coupons.
   *
   * @returns {Promise<{ ok: boolean, data: Coupon[] }>} - Object with ok property and array of coupon data.
   */
  public async getAllCoupons() {
    const coupons = await this.couponRepository.find();
    return { ok: true, data: coupons };
  }

  /**
   * Retrieves a coupon by id.
   *
   * @param {number} id - Coupon id.
   * @returns {Promise<{ ok: boolean, data: Coupon }>} - Object with ok property and coupon data.
   * @throws {NotFoundException} If coupon does not exist.
   */
  public async getOneCoupon(id: number) {
    const coupon = await this.getOneCouponById(id);
    return { ok: true, data: coupon };
  }

  /**
   * Updates a coupon by id.
   *
   * @param {number} id - Coupon id.
   * @param {UpdateCouponDto} updateCouponDto - Coupon data to update.
   * @returns {Promise<{ ok: boolean; message: string; data: Coupon }>} - Object with ok property, coupon data and success message.
   * @throws {NotFoundException} If coupon does not exist.
   */
  public async updateCoupon(id: number, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.getOneCouponById(id);
    const updatedCoupon = this.couponRepository.merge(coupon, updateCouponDto);
    await this.couponRepository.save(updatedCoupon);
    return {
      ok: true,
      message: 'Coupon updated successfully',
      data: updatedCoupon,
    };
  }

  /**
   * Deletes a coupon by id.
   *
   * @param {number} id - Coupon id.
   * @returns {Promise<{ ok: boolean; message: string }>} - Object with ok property and success message.
   * @throws {NotFoundException} If coupon does not exist.
   */
  public async deleteCoupon(id: number) {
    const coupon = await this.getOneCouponById(id);
    await this.couponRepository.remove(coupon);
    return { ok: true, message: 'Coupon deleted successfully' };
  }

  /**
   * Retrieves a coupon by id.
   *
   * @throws {NotFoundException} If coupon does not exist.
   *
   * @param {number} id - Coupon id.
   * @param {EntityManager} [manager] - EntityManager instance.
   * @returns {Promise<Coupon>} - Coupon object.
   */
  public async getOneCouponById(id: number, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(Coupon)
      : this.couponRepository;
    const coupon = await repo.findOne({ where: { id } });

    if (!coupon) {
      throw new NotFoundException({ ok: false, message: 'Coupon not found' });
    }

    return coupon;
  }

  /**
   * Retrieves a coupon by its name.
   *
   * @throws {NotFoundException} If coupon does not exist.
   *
   * @param {string} name - Coupon name.
   * @param {EntityManager} [manager] - EntityManager instance.
   * @returns {Promise<Coupon>} - Coupon object.
   */
  public async getOneCouponByName(name: string, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(Coupon)
      : this.couponRepository;
    const coupon = await repo.findOne({ where: { name } });

    if (!coupon) {
      throw new NotFoundException({ ok: false, message: 'Coupon not found' });
    }

    return coupon;
  }

  /**
   * Retrieves all available coupons for a user.
   *
   * @param {JwtPayloadType} payload - User payload containing user id.
   * @returns {Promise<Coupon[]>} - Array of available coupons.
   * @throws {NotFoundException} If user cart is not found.
   */
  public async getAllAvailableCoupons(payload: JwtPayloadType) {
    return this.entityManager.transaction(async (manager: EntityManager) => {
      const userCart = await this.cartService.getCartByUserId(
        payload.id,
        manager,
      );
      const couponIds = userCart?.coupons.map((coupon) => coupon.id) || [];

      return this.couponRepository.find({
        where: {
          id: Not(In(couponIds)),
          expireDate: MoreThanOrEqual(new Date()),
        },
      });
    });
  }
}
