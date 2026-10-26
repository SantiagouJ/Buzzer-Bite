import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { StoresService } from "../stores/stores.service";
import { CreatePackDto } from "./dto/create-pack.dto";
import { FilterPackDto } from "./dto/filter-pack.dto";
import { UpdatePackDto } from "./dto/update-pack.dto";
import { PackEntity, PackStatus } from "./entities/pack.entity";
import { PackRulesService } from "./pack-rules/pack-rules.service";
import { PacksService } from "./packs.service";
import { describe, expect, it, beforeEach } from "@jest/globals";

describe("PacksService", () => {
  let service: PacksService;

  let packsRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
  };

  let storesServiceMock: {
    findOne: jest.Mock;
  };

  let packRulesServiceMock: {
    ensureDiscountBelowOriginal: jest.Mock;
    ensurePickupWindow: jest.Mock;
  };

  beforeEach(async () => {
    packsRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
    };

    storesServiceMock = {
      findOne: jest.fn(),
    };

    packRulesServiceMock = {
      ensureDiscountBelowOriginal: jest.fn(),
      ensurePickupWindow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PacksService,
        {
          provide: getRepositoryToken(PackEntity),
          useValue: packsRepositoryMock,
        },
        {
          provide: StoresService,
          useValue: storesServiceMock,
        },
        {
          provide: PackRulesService,
          useValue: packRulesServiceMock,
        },
      ],
    }).compile();

    service = module.get<PacksService>(PacksService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("crea un pack validando tienda y reglas de negocio", async () => {
    const createDto: CreatePackDto = {
      store_id: "store-uuid-1",
      title: "Pack Sorpresa Panaderia",
      description: "Panes surtidos",
      original_price: 25000,
      discount_price: 12000,
      stock: 5,
      pickup_start: "18:00",
      pickup_end: "20:00",
      pickup_date: "2026-11-01",
    };

    const mockStore = { id: "store-uuid-1", name: "Panaderia Central" };
    const createdEntity = {
      ...createDto,
      store: mockStore,
    } as unknown as PackEntity;
    const savedEntity = {
      id: "pack-uuid-99",
      ...createdEntity,
      status: PackStatus.AVAILABLE,
    } as unknown as PackEntity;

    storesServiceMock.findOne.mockResolvedValue(mockStore);
    packsRepositoryMock.create.mockReturnValue(createdEntity);
    packsRepositoryMock.save.mockResolvedValue(savedEntity);

    const result = await service.create(createDto);

    expect(storesServiceMock.findOne).toHaveBeenCalledWith("store-uuid-1");
    expect(packRulesServiceMock.ensureDiscountBelowOriginal).toHaveBeenCalledWith(25000, 12000);
    expect(packRulesServiceMock.ensurePickupWindow).toHaveBeenCalledWith("18:00", "20:00");
    expect(packsRepositoryMock.create).toHaveBeenCalled();
    expect(packsRepositoryMock.save).toHaveBeenCalledWith(createdEntity);
    expect(result).toEqual(savedEntity);
  });

  it("obtiene todos los packs ordenados", async () => {
    const mockPacks = [
      { id: "pack-1", title: "Pack Almuerzo" },
      { id: "pack-2", title: "Pack Cena" },
    ] as PackEntity[];

    packsRepositoryMock.find.mockResolvedValue(mockPacks);

    const result = await service.findAll();

    expect(result).toEqual(mockPacks);
    expect(packsRepositoryMock.find).toHaveBeenCalledWith({
      relations: { store: true },
      order: { created_at: "ASC" },
    });
  });

  it("obtiene un pack por id cuando existe", async () => {
    const mockPack = { id: "pack-1", title: "Pack Almuerzo" } as PackEntity;
    packsRepositoryMock.findOne.mockResolvedValue(mockPack);

    const result = await service.findOne("pack-1");

    expect(result).toEqual(mockPack);
    expect(packsRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: "pack-1" },
      relations: { store: true },
    });
  });

  it("lanza NotFoundException cuando el pack no existe", async () => {
    packsRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne("pack-inexistente")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("filtra packs por estado y tienda aplicando limite", async () => {
    const query: FilterPackDto = {
      status: PackStatus.AVAILABLE,
      store_id: "store-uuid-1",
      limit: 5,
    };

    const mockPacks = [{ id: "pack-1" }] as PackEntity[];
    packsRepositoryMock.find.mockResolvedValue(mockPacks);

    const result = await service.findFiltered(query);

    expect(result).toEqual(mockPacks);
    expect(packsRepositoryMock.find).toHaveBeenCalledWith({
      where: {
        status: PackStatus.AVAILABLE,
        store: { id: "store-uuid-1" },
      },
      relations: { store: true },
      order: { created_at: "ASC" },
      take: 5,
    });
  });

  it("actualiza un pack revalidando reglas cuando se modifican precios", async () => {
    const existingPack = {
      id: "pack-1",
      original_price: 20000,
      discount_price: 10000,
      pickup_start: "17:00",
      pickup_end: "19:00",
    } as PackEntity;

    const updateDto: UpdatePackDto = {
      discount_price: 8000,
    };

    const updatedPack = {
      ...existingPack,
      discount_price: 8000,
    } as PackEntity;

    packsRepositoryMock.findOne.mockResolvedValue(existingPack);
    packsRepositoryMock.save.mockResolvedValue(updatedPack);

    const result = await service.update("pack-1", updateDto);

    expect(packRulesServiceMock.ensureDiscountBelowOriginal).toHaveBeenCalledWith(20000, 8000);
    expect(packsRepositoryMock.merge).toHaveBeenCalledWith(existingPack, updateDto);
    expect(packsRepositoryMock.save).toHaveBeenCalledWith(existingPack);
    expect(result).toEqual(updatedPack);
  });
});