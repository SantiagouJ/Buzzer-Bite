import { FavoriteEntity } from "../entities/favorite.entity";
import { FavoriteRulesService } from "./favorite-rules.service";

describe("FavoriteRulesService", () => {
  const service = new FavoriteRulesService();

  it("allows a store that is not a favorite yet", () => {
    expect(() =>
      service.ensureNotAlreadyFavorite(null, "store-id", "user-id"),
    ).not.toThrow();
  });

  it("rejects a store that is already a favorite", () => {
    const favorite = { id: "favorite-id" } as FavoriteEntity;

    expect(() =>
      service.ensureNotAlreadyFavorite(favorite, "store-id", "user-id"),
    ).toThrow();
  });
});
