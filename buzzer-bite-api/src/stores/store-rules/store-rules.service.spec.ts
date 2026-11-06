import { beforeEach, describe, expect, it } from "@jest/globals";
import { ConflictException } from "@nestjs/common";
import { StoreEntity } from "../entities/store.entity";
import { StoreRulesService } from "./store-rules.service";

describe("StoreRulesService", () => {
  let service: StoreRulesService;

  beforeEach(() => {
    service = new StoreRulesService();
  });

  it("permite a un usuario que no tiene tienda", () => {
    expect(() => service.ensureUserHasNoStore(null, "user-id")).not.toThrow();
  });

  it("rechaza a un usuario que ya tiene una tienda registrada", () => {
    const store = { id: "store-id" } as StoreEntity;

    expect(() => service.ensureUserHasNoStore(store, "user-id")).toThrow(
      ConflictException,
    );
  });
});