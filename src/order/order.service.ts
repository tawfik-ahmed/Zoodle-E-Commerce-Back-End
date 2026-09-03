import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import { PaymentMethod } from '../utils/enums';
import { JwtPayloadType, paymentMethods } from '../utils/types';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { EntityManager, Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { CartService } from '../cart/cart.service';
import { TaxService } from '../tax/tax.service';
import { UserService } from '../user/user.service';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { CartItem } from '../cart/entities/cart-item.entity';
import { ProductService } from '../product/product.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class OrderService {
  private readonly stripe;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    private readonly cartService: CartService,
    private readonly taxService: TaxService,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly productService: ProductService,
    private readonly mailerService: MailerService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
    );
  }

  /**
   * Create a new order
   *
   * @param {CreateOrderDto} createOrderDto - Order data.
   * @param {string} paymentMethodType - Payment method type.
   * @param {JwtPayloadType} payload - User data.
   * @param {any} linksAfterPayment - Payment links.
   * @returns {Promise<Order>} - Order data.
   */
  public createOrder(
    createOrderDto: CreateOrderDto,
    paymentMethodType: string,
    payload: JwtPayloadType,
    linksAfterPayment: any,
  ) {
    const { id: userId } = payload;

    if (!paymentMethods.includes(paymentMethodType)) {
      throw new NotFoundException({
        ok: false,
        message: 'Payment Method not found',
      });
    }

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const cart = await this.cartService.getCartByUserId(userId, manager);

      if (!cart) {
        throw new NotFoundException({
          ok: false,
          message: 'Cart not found',
        });
      }

      if (!cart.items.length) {
        throw new BadRequestException({
          ok: false,
          message: 'Cart items is empty',
        });
      }

      const taxes = await this.taxService.getTaxes(manager);
      const user = await this.userService.getUserById(userId, manager);

      let taxPrice = taxes.reduce((acc, tax) => acc + Number(tax.taxPrice), 0);
      let shippingPrice = taxes.reduce(
        (acc, tax) => acc + Number(tax.shippingPrice),
        0,
      );

      let shippingAddress: any = user.address;

      if (createOrderDto?.phone) {
        shippingAddress = { ...createOrderDto };
      }

      if (!shippingAddress) {
        throw new BadRequestException({
          ok: false,
          message: 'Shipping address is required',
        });
      }

      let orderData = {
        user,
        cartItems: cart?.items || [],
        taxPrice,
        shippingPrice,
        orderPrice: cart.totalPriceAfterDiscount + taxPrice + shippingPrice,
        paymentMethod: paymentMethodType as PaymentMethod,
        shippingAddress,
        isPaid: false,
        isDelivered: false,
        deliveredAt: null as Date | null,
      };

      const orderRepo = manager.getRepository(Order);

      if (paymentMethodType === PaymentMethod.CASH) {
        const order = orderRepo.create(orderData);

        if (orderData.orderPrice === 0) {
          await this.productService.processSale(orderData.cartItems, manager);
        }

        await orderRepo.save(order);
        await this.cartService.resetCart(userId, manager);

        return {
          ok: true,
          message: 'Order created successfully',
          order,
        };
      } else if (paymentMethodType === PaymentMethod.CARD) {
        const { success_url, cancel_url } = linksAfterPayment;

        const order = orderRepo.create(orderData);
        await orderRepo.save(order);

        const session = await this.stripe.checkout.sessions.create({
          line_items: orderData.cartItems.map((item: CartItem) => {
            const pricePerUnit =
              item.product.price - (item.product.discount || 0);

            return {
              price_data: {
                currency: 'egp',
                unit_amount: Math.round(pricePerUnit * 100),
                tax_behavior: 'exclusive',
                product_data: {
                  name: item.product.title,
                  description: `Order #${order.id}`,
                  images: [
                    item.product.imageCover,
                    ...item.product.images.map((img) => img.url),
                  ],
                  metadata: {
                    orderId: String(order.id),
                    productId: String(item.product.id),
                    shippingAddress: JSON.stringify(shippingAddress),
                  },
                },
              },
              quantity: item.quantity,
            };
          }),

          mode: 'payment',

          client_reference_id: String(order.id),
          customer_email: user.email,

          success_url,
          cancel_url,
        });

        order.sessionId = session.id;

        await orderRepo.save(order);

        return {
          ok: true,
          message: 'Order created successfully',
          data: {
            totalPrice: session.amount_total / 100,
            expiresAt: new Date(session.expires_at * 1000),
            url: session.url,
            success_url: `${session.success_url}?session_id=${session.id}`,
            cancel_url: session.cancel_url,
            orderData: order,
          },
        };
      }
    });
  }

  /**
   * Update an order paid status.
   *
   * @param {number} orderId - Order id.
   * @param {UpdateOrderDto} updateOrderDto - Order data.
   * @returns {Promise<{ ok: boolean; data: Order[] }>} - Object with ok property and orders data.
   * @throws {NotFoundException} If order not found.
   */
  public async updatePaidWithCash(
    orderId: number,
    updateOrderDto: UpdateOrderDto,
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException({
        ok: false,
        message: 'Order not found',
      });
    }

    if (order.paymentMethod !== PaymentMethod.CASH) {
      throw new BadRequestException({
        ok: false,
        message: 'Order payment method is not cash',
      });
    }

    if (order.isPaid) {
      throw new BadRequestException({
        ok: false,
        message: 'Order is already paid',
      });
    }

    if (updateOrderDto.isPaid) {
      await this.orderRepository.update(orderId, {
        ...updateOrderDto,
        isPaid: true,
        isDelivered: true,
        deliveredAt: new Date(),
      });
      await this.orderRepository.save(order);
    }

    await this.mailerService.sendMail({
      from: `Zoodle E-Commerce <${this.configService.get<string>('GMAIL_USER')}>`,
      to: order.user.email,
      subject: 'Zoodle E-Commerce - Order Paid Successfully (Cash)',
      html: `<div>
        <h1>Order #${order.id} has been paid</h1>
        <p>Thank you for using our service!</p>
        <p>Best regards,<br/>Zoodle E-Commerce</p>
      </div>`,
    });
    return {
      ok: true,
      message: 'Order updated successfully',
      order,
    };
  }

  /**
   * Update an order paid status.
   *
   * @param {any} body - Order data.
   * @param {string} signature - Order data.
   * @param {string} endpointSecret - Order data.
   * @returns {Promise<{ ok: boolean; data: Order[] }>} - Object with ok property and orders data.
   * @throws {NotFoundException} If order not found.
   * @throws {BadRequestException} If order payment method is not cash.
   * @throws {BadRequestException} If order is already paid.
   * */
  public async stripeWebhook(
    body: any,
    signature: string,
    endpointSecret: string,
  ) {
    let event;

    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        endpointSecret,
      );
    } catch (error: any) {
      throw new BadRequestException({
        ok: false,
        message: error.message,
      });
    }

    switch (event.type) {
      case 'checkout.session.completed':
        const sessionId = event.data.object.id;
        console.log('SESSION ID FROM STRIPE:', sessionId);

        const order = await this.orderRepository.findOne({
          where: { sessionId: sessionId },
          relations: ['user', 'cartItems', 'cartItems.product'],
        });

        console.log(order);
        if (!order) {
          throw new NotFoundException({
            ok: false,
            message: 'Order not found',
          });
        }

        await this.orderRepository.update(order.id, {
          isPaid: true,
          isDelivered: true,
          deliveredAt: new Date(),
        });
        await this.orderRepository.save(order);

        await Promise.all([
          await this.cartService.resetCart(order.user.id),
          await this.productService.processSale(order.cartItems),
        ]);

        await this.mailerService.sendMail({
          from: `Zoodle E-Commerce <${this.configService.get<string>('GMAIL_USER')}>`,
          to: order.user.email,
          subject: 'Order Paid Successfully',
          html: `<h1>Paid</h1>`,
        });

        break;
      default:
        console.log(`Unhandled event type ${event.type}.`);
    }

    return {
      ok: true,
      message: 'Order updated successfully',
    };
  }

  /**
   * Retrieves user orders.
   *
   * @param {JwtPayloadType} payload - User data.
   * @returns {Promise<{ ok: boolean; data: Order[] }>} - Object with ok property and orders data.
   * @throws {NotFoundException} If user does not exist.
   */
  public async getMyOrders(payload: JwtPayloadType) {
    const { id: userId } = payload;
    return this.getUserOrders(userId);
  }

  /**
   * Retrieves user orders.
   *
   * @param {number} userId - User id.
   * @returns {Promise<{ ok: boolean; data: Order[] }>} - Object with ok property and orders data.
   * @throws {NotFoundException} If user does not exist.
   */
  public async getUserOrders(userId: number) {
    const user = await this.userService.getUserById(userId);
    const orders = await this.orderRepository.find({
      where: { user: { id: user.id } },
    });
    return { ok: true, data: orders };
  }
}
