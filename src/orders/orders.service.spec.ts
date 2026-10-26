import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AuthService } from "../auth/auth.service";
import { PackEntity, PackStatus } from "../packs/entities/pack.entity";
import { ClaimOrderDto } from "./dto/claim-order.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { OrderEntity, OrderStatus } from "./entities/order.entity";
import { OrderRulesService } from "./order-rules/order-rules.service";
import { OrdersService } from "./orders.service";

describe("OrdersService", () => {
  let service: OrdersService;

  let ordersRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  let packsRepositoryMock: {
    findOneBy: jest.Mock;
    save: jest.Mock;
  };

  let authServiceMock: {
    findEntity: jest.Mock;
  };

  let orderRulesServiceMock: {
    ensureCanBeReserved: jest.Mock;
    ensureCanBeClaimed: jest.Mock;
    ensureCanUpdateQuantity: jest.Mock;
  };

  beforeEach(async () => {
    ordersRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    packsRepositoryMock = {
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    authServiceMock = {
      findEntity: jest.fn(),
    };

    orderRulesServiceMock = {
      ensureCanBeReserved: jest.fn(),
      ensureCanBeClaimed: jest.fn(),
      ensureCanUpdateQuantity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: ordersRepositoryMock,
        },
        {
          provide: getRepositoryToken(PackEntity),
          useValue: packsRepositoryMock,
        },
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: OrderRulesService,
          useValue: orderRulesServiceMock,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("crea y reserva una orden descontando el inventario del pack", async () => {
    const createDto: CreateOrderDto = {
      consumer_id: "consumer-uuid-1",
      pack_id: "pack-uuid-1",
      quantity: 2,
    };

    const mockConsumer = { id: "consumer-uuid-1", full_name: "Sergio Arias" };
    const mockPack = {
      id: "pack-uuid-1",
      stock: 5,
      discount_price: 10000,
      status: PackStatus.AVAILABLE,
    } as PackEntity;

    const mockCreatedOrder = {
      consumer: mockConsumer,
      pack: mockPack,
      quantity: 2,
      total_price: 20000,
      status: OrderStatus.RESERVED,
    } as OrderEntity;

    const mockSavedOrder = {
      id: "order-uuid-99",
      ...mockCreatedOrder,
    } as OrderEntity;

    authServiceMock.findEntity.mockResolvedValue(mockConsumer);
    packsRepositoryMock.findOneBy.mockResolvedValue(mockPack);
    packsRepositoryMock.save.mockResolvedValue(mockPack);
    ordersRepositoryMock.create.mockReturnValue(mockCreatedOrder);
    ordersRepositoryMock.save.mockResolvedValue(mockSavedOrder);

    const result = await service.create(createDto);

    expect(authServiceMock.findEntity).toHaveBeenCalledWith("consumer-uuid-1");
    expect(packsRepositoryMock.findOneBy).toHaveBeenCalledWith({
      id: "pack-uuid-1",
    });
    expect(orderRulesServiceMock.ensureCanBeReserved).toHaveBeenCalledWith(
      mockPack,
      2,
    );
    expect(mockPack.stock).toBe(3);
    expect(packsRepositoryMock.save).toHaveBeenCalledWith(mockPack);
    expect(ordersRepositoryMock.create).toHaveBeenCalled();
    expect(ordersRepositoryMock.save).toHaveBeenCalledWith(mockCreatedOrder);
    expect(result).toEqual(mockSavedOrder);
  });

  it("marca el pack como SOLD_OUT si la reserva consume el ultimo stock disponible", async () => {
    const createDto: CreateOrderDto = {
      consumer_id: "consumer-uuid-1",
      pack_id: "pack-uuid-1",
      quantity: 1,
    };

    const mockConsumer = { id: "consumer-uuid-1" };
    const mockPack = {
      id: "pack-uuid-1",
      stock: 1,
      discount_price: 15000,
      status: PackStatus.AVAILABLE,
    } as PackEntity;

    authServiceMock.findEntity.mockResolvedValue(mockConsumer);
    packsRepositoryMock.findOneBy.mockResolvedValue(mockPack);
    packsRepositoryMock.save.mockResolvedValue(mockPack);
    ordersRepositoryMock.create.mockReturnValue({} as OrderEntity);
    ordersRepositoryMock.save.mockResolvedValue({} as OrderEntity);

    await service.create(createDto);

    expect(mockPack.stock).toBe(0);
    expect(mockPack.status).toBe(PackStatus.SOLD_OUT);
    expect(packsRepositoryMock.save).toHaveBeenCalledWith(mockPack);
  });

  it("lanza NotFoundException al crear si el pack no existe", async () => {
    authServiceMock.findEntity.mockResolvedValue({ id: "consumer-1" });
    packsRepositoryMock.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({
        consumer_id: "consumer-1",
        pack_id: "pack-inexistente",
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(ordersRepositoryMock.save).not.toHaveBeenCalled();
  });

  it("no descuenta stock ni guarda si la regla rechaza la reserva", async () => {
    const mockPack = {
      id: "pack-1",
      stock: 1,
      status: PackStatus.AVAILABLE,
    } as PackEntity;

    authServiceMock.findEntity.mockResolvedValue({ id: "consumer-1" });
    packsRepositoryMock.findOneBy.mockResolvedValue(mockPack);
    orderRulesServiceMock.ensureCanBeReserved.mockImplementation(() => {
      throw new ConflictException("Cannot reserve units");
    });

    await expect(
      service.create({
        consumer_id: "consumer-1",
        pack_id: "pack-1",
        quantity: 5,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(mockPack.stock).toBe(1);
    expect(packsRepositoryMock.save).not.toHaveBeenCalled();
    expect(ordersRepositoryMock.save).not.toHaveBeenCalled();
  });

  it("obtiene todas las ordenes registradas", async () => {
    const mockOrders = [{ id: "order-1" }, { id: "order-2" }] as OrderEntity[];
    ordersRepositoryMock.find.mockResolvedValue(mockOrders);

    const result = await service.findAll();

    expect(result).toEqual(mockOrders);
    expect(ordersRepositoryMock.find).toHaveBeenCalledWith({
      relations: { consumer: true, pack: true },
      order: { created_at: "ASC" },
    });
  });

  it("obtiene una orden por id cuando existe", async () => {
    const mockOrder = { id: "order-1" } as OrderEntity;
    ordersRepositoryMock.findOne.mockResolvedValue(mockOrder);

    const result = await service.findOne("order-1");

    expect(result).toEqual(mockOrder);
    expect(ordersRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: "order-1" },
      relations: { consumer: true, pack: true },
    });
  });

  it("lanza NotFoundException si la orden no existe al buscar por id", async () => {
    ordersRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne("order-inexistente")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("canjea una orden cambiando su estado a CLAIMED y registrando la fecha", async () => {
    const existingOrder = {
      id: "order-1",
      status: OrderStatus.RESERVED,
      verification_code: "qr-hash-123",
      claimed_at: null,
    } as OrderEntity;

    const claimDto: ClaimOrderDto = {
      verification_code: "qr-hash-123",
    };

    ordersRepositoryMock.findOne.mockResolvedValue(existingOrder);
    ordersRepositoryMock.save.mockImplementation(
      async (entity) => entity as OrderEntity,
    );

    const result = await service.claim("order-1", claimDto);

    expect(orderRulesServiceMock.ensureCanBeClaimed).toHaveBeenCalledWith(
      existingOrder,
      "qr-hash-123",
    );
    expect(existingOrder.status).toBe(OrderStatus.CLAIMED);
    expect(existingOrder.claimed_at).toBeInstanceOf(Date);
    expect(ordersRepositoryMock.save).toHaveBeenCalledWith(existingOrder);
    expect(result.status).toBe(OrderStatus.CLAIMED);
  });

  it("rechaza el canje y no modifica la orden si la regla de canje falla", async () => {
    const existingOrder = {
      id: "order-1",
      status: OrderStatus.CLAIMED,
      verification_code: "qr-hash-123",
    } as OrderEntity;

    ordersRepositoryMock.findOne.mockResolvedValue(existingOrder);
    orderRulesServiceMock.ensureCanBeClaimed.mockImplementation(() => {
      throw new ConflictException("Order cannot be claimed");
    });

    await expect(
      service.claim("order-1", { verification_code: "qr-hash-invalido" }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(ordersRepositoryMock.save).not.toHaveBeenCalled();
  });

  it("actualiza la cantidad de una orden ajustando el stock del pack asociado", async () => {
    const mockPack = {
      id: "pack-1",
      stock: 10,
      discount_price: 12000,
      status: PackStatus.AVAILABLE,
    } as PackEntity;

    const existingOrder = {
      id: "order-1",
      quantity: 2,
      total_price: 24000,
      status: OrderStatus.RESERVED,
      pack: mockPack,
    } as OrderEntity;

    const updateDto: UpdateOrderDto = {
      quantity: 4,
    };

    ordersRepositoryMock.findOne.mockResolvedValue(existingOrder);
    packsRepositoryMock.save.mockResolvedValue(mockPack);
    ordersRepositoryMock.save.mockImplementation(
      async (entity) => entity as OrderEntity,
    );

    const result = await service.update("order-1", updateDto);

    expect(orderRulesServiceMock.ensureCanUpdateQuantity).toHaveBeenCalledWith(
      existingOrder,
    );
    expect(mockPack.stock).toBe(8);
    expect(existingOrder.quantity).toBe(4);
    expect(existingOrder.total_price).toBe(48000);
    expect(packsRepositoryMock.save).toHaveBeenCalledWith(mockPack);
    expect(ordersRepositoryMock.save).toHaveBeenCalledWith(existingOrder);
    expect(result.quantity).toBe(4);
  });

  it("valida la regla de reserva si el incremento supera el stock disponible del pack", async () => {
    const mockPack = {
      id: "pack-1",
      stock: 1,
      discount_price: 12000,
      status: PackStatus.AVAILABLE,
    } as PackEntity;

    const existingOrder = {
      id: "order-1",
      quantity: 2,
      total_price: 24000,
      status: OrderStatus.RESERVED,
      pack: mockPack,
    } as OrderEntity;

    const updateDto: UpdateOrderDto = {
      quantity: 5,
    };

    ordersRepositoryMock.findOne.mockResolvedValue(existingOrder);

    await service.update("order-1", updateDto);

    expect(orderRulesServiceMock.ensureCanBeReserved).toHaveBeenCalledWith(
      mockPack,
      3,
    );
  });
});