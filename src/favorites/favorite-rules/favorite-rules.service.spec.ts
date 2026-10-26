import { beforeEach, describe, expect, it } from "@jest/globals";
import { ConflictException } from "@nestjs/common";
import { FavoriteEntity } from "../entities/favorite.entity";
import { FavoriteRulesService } from "./favorite-rules.service";

describe("FavoriteRulesService", () => {
  let service: FavoriteRulesService;

  beforeEach(() => {
    service = new FavoriteRulesService();
  });

  it("permite asociar una tienda que aun no es favorita", () => {
    expect(() =>
      service.ensureNotAlreadyFavorite(null, "store-id", "user-id"),
    ).not.toThrow();
  });

  it("rechaza asociar una tienda que ya es favorita del usuario", () => {
    const favorite = { id: "favorite-id" } as FavoriteEntity;

    expect(() =>
      service.ensureNotAlreadyFavorite(favorite, "store-id", "user-id"),
    ).toThrow(ConflictException);
  });
});