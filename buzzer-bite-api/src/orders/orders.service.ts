import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes } from "node:crypto";
import { FindOptionsWhere, Repository } from "typeorm";
import { assertRole, assertSameActor } from "../auth/assert-actor";
import { AuthActor } from "../auth/auth-actor";
import { AuthService } from "../auth/auth.service";
import { UserRole } from "../auth/entities/user.entity";
import { PackEntity, PackStatus } from "../packs/entities/pack.entity";
import { ClaimOrderDto } from "./dto/claim-order.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { OrderEntity, OrderStatus } from "./entities/order.entity";
import { OrderRulesService } from "./order-rules/order-rules.service";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,

    @InjectRepository(PackEntity)
    private readonly packsRepository: Repository<PackEntity>,

    private readonly authService: AuthService,

    private readonly orderRulesService: OrderRulesService,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    actor: AuthActor,
  ): Promise<OrderEntity> {
    assertRole(actor, UserRole.CONSUMER);
    assertSameActor(actor.id, createOrderDto.consumer_id);

    const consumer = await this.authService.findEntity(
      createOrderDto.consumer_id,
    );
    const pack = await this.packsRepository.findOneBy({
      id: createOrderDto.pack_id,
    });

    if (!pack) {
      throw new NotFoundException(
        `Pack with id ${createOrderDto.pack_id} was not found`,
      );
    }

    this.orderRulesService.ensureCanBeReserved(
      pack,
      createOrderDto.quantity,
    );

    pack.stock -= createOrderDto.quantity;
    if (pack.stock === 0) {
      pack.status = PackStatus.SOLD_OUT;
    }
    await this.packsRepository.save(pack);

    const order = this.ordersRepository.create({
      consumer,
      pack,
      quantity: createOrderDto.quantity,
      total_price: pack.discount_price * createOrderDto.quantity,
      verification_code: randomBytes(16).toString("hex"),
      status: OrderStatus.RESERVED,
    });

    return this.ordersRepository.save(order);
  }

  async findAll(actor: AuthActor): Promise<OrderEntity[]> {
    return this.ordersRepository.find({
      where: this.visibleTo(actor),
      relations: { consumer: true, pack: true },
      order: { created_at: "ASC" },
    });
  }

  async findOne(id: string, actor: AuthActor): Promise<OrderEntity> {
    const order = await this.ordersRepository.findOne({
      where: { id, ...this.visibleTo(actor) },
      relations: { consumer: true, pack: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} was not found`);
    }

    return order;
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
    actor: AuthActor,
  ): Promise<OrderEntity> {
    assertRole(actor, UserRole.CONSUMER);
    const order = await this.findOne(id, actor);

    this.orderRulesService.ensureCanUpdateQuantity(order);

    if (
      updateOrderDto.quantity !== undefined &&
      updateOrderDto.quantity !== order.quantity
    ) {
      const delta = updateOrderDto.quantity - order.quantity;

      if (delta > 0 && order.pack.stock < delta) {
        this.orderRulesService.ensureCanBeReserved(order.pack, delta);
      }

      order.pack.stock -= delta;
      if (order.pack.stock === 0) {
        order.pack.status = PackStatus.SOLD_OUT;
      } else if (order.pack.status === PackStatus.SOLD_OUT) {
        order.pack.status = PackStatus.AVAILABLE;
      }

      order.quantity = updateOrderDto.quantity;
      order.total_price = order.pack.discount_price * updateOrderDto.quantity;
      await this.packsRepository.save(order.pack);
    }

    return this.ordersRepository.save(order);
  }

  async claim(
    id: string,
    claimOrderDto: ClaimOrderDto,
    actor: AuthActor,
  ): Promise<OrderEntity> {
    assertRole(actor, UserRole.MERCHANT);
    const order = await this.findOne(id, actor);

    this.orderRulesService.ensureCanBeClaimed(
      order,
      claimOrderDto.verification_code,
    );

    order.status = OrderStatus.CLAIMED;
    order.claimed_at = new Date();

    return this.ordersRepository.save(order);
  }

  private visibleTo(actor: AuthActor): FindOptionsWhere<OrderEntity> {
    if (actor.role === UserRole.CONSUMER) {
      return { consumer: { id: actor.id } };
    }

    return { pack: { store: { user: { id: actor.id } } } };
  }
}
