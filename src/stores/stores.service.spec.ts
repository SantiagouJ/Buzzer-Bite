import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../auth/auth.service";
import { StoreRulesService } from "./store-rules/store-rules.service";
import { StoresService } from "./stores.service";

describe("StoresService", () => {
  let service: StoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: "StoreEntityRepository",
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: StoreRulesService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
