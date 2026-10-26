import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AuthService } from "../auth/auth.service";
import { CreateStoreDto } from "./dto/create-store.dto";
import { NearbyStoreDto } from "./dto/nearby-store.dto";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { StoreEntity } from "./entities/store.entity";
import { StoreRulesService } from "./store-rules/store-rules.service";
import { StoresService } from "./stores.service";
import { describe, expect, it, beforeEach } from "@jest/globals";

describe("StoresService", () => {
  let service: StoresService;

  let storesRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
  };

  let authServiceMock: {
    findEntity: jest.Mock;
  };

  let storeRulesServiceMock: {
    ensureUserHasNoStore: jest.Mock;
  };

  beforeEach(async () => {
    storesRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
    };

    authServiceMock = {
      findEntity: jest.fn(),
    };

    storeRulesServiceMock = {
      ensureUserHasNoStore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: getRepositoryToken(StoreEntity),
          useValue: storesRepositoryMock,
        },
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: StoreRulesService,
          useValue: storeRulesServiceMock,
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("crea una tienda validando usuario y reglas de unicidad", async () => {
    const createDto: CreateStoreDto = {
      user_id: "user-uuid-1",
      name: "Panaderia Delicia",
      address: "Calle 5 # 10-20",
      latitude: 3.4516,
      longitude: -76.532,
      category: "Panaderia",
    };

    const mockUser = {
      id: "user-uuid-1",
      full_name: "Carlos Gomez",
    };

    const storeCreated = {
      name: createDto.name,
      address: createDto.address,
      latitude: createDto.latitude,
      longitude: createDto.longitude,
      category: createDto.category,
      user: mockUser,
    } as unknown as StoreEntity;

    const savedStore = {
      id: "store-uuid-99",
      ...storeCreated,
    } as unknown as StoreEntity;

    authServiceMock.findEntity.mockResolvedValue(mockUser);
    storesRepositoryMock.findOneBy.mockResolvedValue(null);
    storesRepositoryMock.create.mockReturnValue(storeCreated);
    storesRepositoryMock.save.mockResolvedValue(savedStore);
    storesRepositoryMock.findOne.mockResolvedValue(savedStore);

    const result = await service.create(createDto);

    expect(authServiceMock.findEntity).toHaveBeenCalledWith("user-uuid-1");
    expect(storesRepositoryMock.findOneBy).toHaveBeenCalledWith({
      user: { id: "user-uuid-1" },
    });
    expect(storeRulesServiceMock.ensureUserHasNoStore).toHaveBeenCalledWith(
      null,
      "user-uuid-1",
    );
    expect(storesRepositoryMock.create).toHaveBeenCalled();
    expect(storesRepositoryMock.save).toHaveBeenCalledWith(storeCreated);
    expect(result).toEqual(savedStore);
  });

  it("rechaza la creacion si el usuario ya tiene una tienda registrada", async () => {
    const createDto: CreateStoreDto = {
      user_id: "user-uuid-1",
      name: "Segunda Tienda",
      address: "Carrera 1 # 2-3",
      latitude: 3.45,
      longitude: -76.53,
      category: "Cafeteria",
    };

    const existingStore = { id: "store-existente" } as StoreEntity;

    authServiceMock.findEntity.mockResolvedValue({ id: "user-uuid-1" });
    storesRepositoryMock.findOneBy.mockResolvedValue(existingStore);
    storeRulesServiceMock.ensureUserHasNoStore.mockImplementation(() => {
      throw new ConflictException("User already has a store");
    });

    await expect(service.create(createDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(storesRepositoryMock.create).not.toHaveBeenCalled();
    expect(storesRepositoryMock.save).not.toHaveBeenCalled();
  });

  it("obtiene todas las tiendas ordenadas", async () => {
    const mockStores = [
      { id: "store-1", name: "Tienda Uno" },
      { id: "store-2", name: "Tienda Dos" },
    ] as StoreEntity[];

    storesRepositoryMock.find.mockResolvedValue(mockStores);

    const result = await service.findAll();

    expect(result).toEqual(mockStores);
    expect(storesRepositoryMock.find).toHaveBeenCalled();
  });

  it("obtiene una tienda por id cuando existe", async () => {
    const mockStore = { id: "store-1", name: "Tienda Uno" } as StoreEntity;
    storesRepositoryMock.findOne.mockResolvedValue(mockStore);

    const result = await service.findOne("store-1");

    expect(result).toEqual(mockStore);
    expect(storesRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: "store-1" },
      select: expect.anything(),
      relations: { user: true },
    });
  });

  it("lanza NotFoundException cuando la tienda no existe", async () => {
    storesRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne("id-inexistente")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("filtra tiendas cercanas por formula de Haversine dentro del radio especificado", async () => {
    const query: NearbyStoreDto = {
      latitude: 3.4516,
      longitude: -76.532,
      radius: 5,
    };

    const storesInDb = [
      {
        id: "store-cercana",
        name: "Panaderia Barrio",
        latitude: 3.452,
        longitude: -76.531,
      },
      {
        id: "store-lejana",
        name: "Restaurante Otra Ciudad",
        latitude: 4.6097,
        longitude: -74.0817,
      },
    ] as StoreEntity[];

    storesRepositoryMock.find.mockResolvedValue(storesInDb);

    const result = await service.findNearby(query);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe("store-cercana");
    expect(result[0].distance_km).toBeLessThanOrEqual(5);
  });

  it("actualiza una tienda existente fusionando sus datos", async () => {
    const existingStore = {
      id: "store-1",
      name: "Nombre Viejo",
      address: "Direccion Vieja",
    } as StoreEntity;

    const updateDto: UpdateStoreDto = {
      name: "Nombre Nuevo",
    };

    const updatedStore = {
      ...existingStore,
      name: "Nombre Nuevo",
    } as StoreEntity;

    storesRepositoryMock.findOne
      .mockResolvedValueOnce(existingStore)
      .mockResolvedValueOnce(updatedStore);

    const result = await service.update("store-1", updateDto);

    expect(storesRepositoryMock.merge).toHaveBeenCalledWith(
      existingStore,
      updateDto,
    );
    expect(storesRepositoryMock.save).toHaveBeenCalledWith(existingStore);
    expect(result).toEqual(updatedStore);
  });
});