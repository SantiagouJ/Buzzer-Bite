import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../auth/auth.service";
import { StoresService } from "../stores/stores.service";
import { FavoriteRulesService } from "./favorite-rules/favorite-rules.service";
import { FavoritesService } from "./favorites.service";

describe("FavoritesService", () => {
  let service: FavoritesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: "FavoriteEntityRepository",
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: StoresService,
          useValue: {},
        },
        {
          provide: FavoriteRulesService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
