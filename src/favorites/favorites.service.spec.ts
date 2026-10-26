import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AuthService } from "../auth/auth.service";
import { StoresService } from "../stores/stores.service";
import { FavoriteEntity } from "./entities/favorite.entity";
import { FavoriteRulesService } from "./favorite-rules/favorite-rules.service";
import { FavoritesService } from "./favorites.service";

describe("FavoritesService", () => {
  let service: FavoritesService;

  let favoritesRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  let authServiceMock: {
    findEntity: jest.Mock;
  };

  let storesServiceMock: {
    findOne: jest.Mock;
  };

  let favoriteRulesServiceMock: {
    ensureNotAlreadyFavorite: jest.Mock;
  };

  beforeEach(async () => {
    favoritesRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    authServiceMock = {
      findEntity: jest.fn(),
    };

    storesServiceMock = {
      findOne: jest.fn(),
    };

    favoriteRulesServiceMock = {
      ensureNotAlreadyFavorite: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: getRepositoryToken(FavoriteEntity),
          useValue: favoritesRepositoryMock,
        },
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        {
          provide: StoresService,
          useValue: storesServiceMock,
        },
        {
          provide: FavoriteRulesService,
          useValue: favoriteRulesServiceMock,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("crea un favorito validando usuario, tienda y reglas de unicidad", async () => {
    const createDto = {
      user_id: "user-uuid-1",
      store_id: "store-uuid-1",
    };

    const mockUser = { id: "user-uuid-1", full_name: "Sergio Arias" };
    const mockStore = { id: "store-uuid-1", name: "Panaderia Central" };

    const createdFavorite = {
      user: mockUser,
      store: mockStore,
    } as unknown as FavoriteEntity;

    const savedFavorite = {
      id: "favorite-uuid-99",
      ...createdFavorite,
      created_at: new Date(),
    } as unknown as FavoriteEntity;

    authServiceMock.findEntity.mockResolvedValue(mockUser);
    storesServiceMock.findOne.mockResolvedValue(mockStore);
    favoritesRepositoryMock.findOneBy.mockResolvedValue(null);
    favoritesRepositoryMock.create.mockReturnValue(createdFavorite);
    favoritesRepositoryMock.save.mockResolvedValue(savedFavorite);
    favoritesRepositoryMock.findOne.mockResolvedValue(savedFavorite);

    const result = await service.create(createDto as any);

    expect(authServiceMock.findEntity).toHaveBeenCalledWith("user-uuid-1");
    expect(storesServiceMock.findOne).toHaveBeenCalledWith("store-uuid-1");
    expect(favoritesRepositoryMock.findOneBy).toHaveBeenCalledWith({
      user: { id: "user-uuid-1" },
      store: { id: "store-uuid-1" },
    });
    expect(
      favoriteRulesServiceMock.ensureNotAlreadyFavorite,
    ).toHaveBeenCalledWith(null, "store-uuid-1", "user-uuid-1");
    expect(favoritesRepositoryMock.create).toHaveBeenCalledWith({
      user: mockUser,
      store: mockStore,
    });
    expect(favoritesRepositoryMock.save).toHaveBeenCalledWith(createdFavorite);
    expect(result).toEqual(savedFavorite);
  });

  it("rechaza la creacion si la tienda ya habia sido marcada como favorita", async () => {
    const createDto = {
      user_id: "user-uuid-1",
      store_id: "store-uuid-1",
    };

    const existingFavorite = { id: "favorite-existente" } as FavoriteEntity;

    authServiceMock.findEntity.mockResolvedValue({ id: "user-uuid-1" });
    storesServiceMock.findOne.mockResolvedValue({ id: "store-uuid-1" });
    favoritesRepositoryMock.findOneBy.mockResolvedValue(existingFavorite);
    favoriteRulesServiceMock.ensureNotAlreadyFavorite.mockImplementation(() => {
      throw new ConflictException("Store already a favorite");
    });

    await expect(service.create(createDto as any)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(favoritesRepositoryMock.create).not.toHaveBeenCalled();
    expect(favoritesRepositoryMock.save).not.toHaveBeenCalled();
  });

  it("obtiene todos los favoritos ordenados", async () => {
    const mockFavorites = [
      { id: "fav-1" },
      { id: "fav-2" },
    ] as FavoriteEntity[];

    favoritesRepositoryMock.find.mockResolvedValue(mockFavorites);

    const result = await service.findAll();

    expect(result).toEqual(mockFavorites);
    expect(favoritesRepositoryMock.find).toHaveBeenCalledWith({
      select: expect.anything(),
      relations: { user: true, store: true },
      order: { created_at: "ASC" },
    });
  });

  it("obtiene un favorito por id cuando existe", async () => {
    const mockFavorite = { id: "fav-1" } as FavoriteEntity;
    favoritesRepositoryMock.findOne.mockResolvedValue(mockFavorite);

    const result = await service.findOne("fav-1");

    expect(result).toEqual(mockFavorite);
    expect(favoritesRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: "fav-1" },
      select: expect.anything(),
      relations: { user: true, store: true },
    });
  });

  it("lanza NotFoundException cuando el favorito no existe", async () => {
    favoritesRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne("fav-inexistente")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("elimina un favorito existente", async () => {
    const existingFavorite = { id: "fav-1" } as FavoriteEntity;
    favoritesRepositoryMock.findOne.mockResolvedValue(existingFavorite);
    favoritesRepositoryMock.remove.mockResolvedValue(existingFavorite);

    await service.remove("fav-1");

    expect(favoritesRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: "fav-1" },
      select: expect.anything(),
      relations: { user: true, store: true },
    });
    expect(favoritesRepositoryMock.remove).toHaveBeenCalledWith(
      existingFavorite,
    );
  });
});