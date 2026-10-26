import { BadRequestException } from "@nestjs/common";
import { PackRulesService } from "./pack-rules.service";
import { describe, expect, it, beforeEach } from "@jest/globals";

describe("PackRulesService", () => {
  let service: PackRulesService;

  beforeEach(() => {
    service = new PackRulesService();
  });

  it("permite descuento menor al precio original", () => {
    expect(() =>
      service.ensureDiscountBelowOriginal(20000, 12000),
    ).not.toThrow();
  });

  it("rechaza si el descuento es mayor o igual al precio original", () => {
    expect(() =>
      service.ensureDiscountBelowOriginal(15000, 15000),
    ).toThrow(BadRequestException);

    expect(() =>
      service.ensureDiscountBelowOriginal(10000, 15000),
    ).toThrow(BadRequestException);
  });

  it("permite una ventana de retiro donde el fin es posterior al inicio", () => {
    expect(() =>
      service.ensurePickupWindow("18:00", "20:00"),
    ).not.toThrow();
  });

  it("rechaza si la hora de fin es anterior o igual a la de inicio", () => {
    expect(() =>
      service.ensurePickupWindow("19:00", "19:00"),
    ).toThrow(BadRequestException);

    expect(() =>
      service.ensurePickupWindow("20:00", "18:00"),
    ).toThrow(BadRequestException);
  });
});