import { beforeEach, describe, expect, it } from "@jest/globals";
import { ConflictException } from "@nestjs/common";
import { OrderStatus } from "../entities/order.entity";
import { PackEntity, PackStatus } from "../../packs/entities/pack.entity";
import { OrderRulesService } from "./order-rules.service";

describe("OrderRulesService", () => {
  let service: OrderRulesService;

  beforeEach(() => {
    service = new OrderRulesService();
  });

  it("permite reservar cuando el pack esta disponible y tiene stock suficiente", () => {
    const pack = {
      id: "pack-1",
      status: PackStatus.AVAILABLE,
      stock: 5,
    } as PackEntity;

    expect(() => service.ensureCanBeReserved(pack, 2)).not.toThrow();
  });

  it("rechaza reservar cuando el pack no esta disponible o no tiene stock", () => {
    const soldOutPack = {
      id: "pack-1",
      status: PackStatus.SOLD_OUT,
      stock: 0,
    } as PackEntity;

    expect(() => service.ensureCanBeReserved(soldOutPack, 1)).toThrow(
      ConflictException,
    );

    const availablePackLowStock = {
      id: "pack-2",
      status: PackStatus.AVAILABLE,
      stock: 1,
    } as PackEntity;

    expect(() => service.ensureCanBeReserved(availablePackLowStock, 3)).toThrow(
      ConflictException,
    );
  });

  it("permite canjear cuando la orden esta reservada y el codigo coincide", () => {
    const order = {
      status: OrderStatus.RESERVED,
      verification_code: "token-secreto-123",
    };

    expect(() =>
      service.ensureCanBeClaimed(order, "token-secreto-123"),
    ).not.toThrow();
  });

  it("rechaza el canje si la orden no esta reservada o el codigo no coincide", () => {
    const claimedOrder = {
      status: OrderStatus.CLAIMED,
      verification_code: "token-secreto-123",
    };

    expect(() =>
      service.ensureCanBeClaimed(claimedOrder, "token-secreto-123"),
    ).toThrow(ConflictException);

    const reservedOrder = {
      status: OrderStatus.RESERVED,
      verification_code: "token-secreto-123",
    };

    expect(() =>
      service.ensureCanBeClaimed(reservedOrder, "codigo-incorrecto"),
    ).toThrow(ConflictException);
  });

  it("permite actualizar cantidad solo en ordenes reservadas", () => {
    const reservedOrder = { status: OrderStatus.RESERVED };
    expect(() =>
      service.ensureCanUpdateQuantity(reservedOrder),
    ).not.toThrow();

    const cancelledOrder = { status: OrderStatus.CANCELLED };
    expect(() =>
      service.ensureCanUpdateQuantity(cancelledOrder),
    ).toThrow(ConflictException);
  });
});