import { StoreEntity } from "../entities/store.entity";
import { StoreRulesService } from "./store-rules.service";

describe("StoreRulesService", () => {
  const service = new StoreRulesService();

  it("allows a user without a store", () => {
    expect(() => service.ensureUserHasNoStore(null, "user-id")).not.toThrow();
  });

  it("rejects a user that already has a store", () => {
    const store = { id: "store-id" } as StoreEntity;

    expect(() => service.ensureUserHasNoStore(store, "user-id")).toThrow();
  });
});
