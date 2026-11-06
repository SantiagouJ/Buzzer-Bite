import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AuthController } from "../src/auth/auth.controller";
import { AuthService } from "../src/auth/auth.service";
import { JwtAuthGuard } from "../src/auth/guards/jwt-auth.guard";
import { OrdersController } from "../src/orders/orders.controller";
import { OrdersService } from "../src/orders/orders.service";
import { PacksController } from "../src/packs/packs.controller";
import { PacksService } from "../src/packs/packs.service";
import { StoresController } from "../src/stores/stores.controller";
import { StoresService } from "../src/stores/stores.service";
import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";

describe("Buzzer-Bite API (e2e)", () => {
  let app: INestApplication;

  const packsServiceMock = {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
  };

  const storesServiceMock = {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
  };

  const ordersServiceMock = {
    create: jest.fn(),
  };

  const authServiceMock = {
    login: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        PacksController,
        StoresController,
        OrdersController,
        AuthController,
      ],
      providers: [
        { provide: PacksService, useValue: packsServiceMock },
        { provide: StoresService, useValue: storesServiceMock },
        { provide: OrdersService, useValue: ordersServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("Packs Endpoints", () => {
    it("GET /api/packs responde 200 y retorna una lista", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/packs")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("POST /api/packs rechaza con 400 Bad Request si el body esta vacio", async () => {
      await request(app.getHttpServer())
        .post("/api/packs")
        .send({})
        .expect(400);
    });
  });

  describe("Stores Endpoints", () => {
    it("GET /api/stores responde 200 y retorna una lista", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/stores")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("POST /api/stores rechaza con 400 si las coordenadas no son validas", async () => {
      await request(app.getHttpServer())
        .post("/api/stores")
        .send({
          user_id: "user-1",
          name: "Tienda",
          address: "Calle 1",
          latitude: "invalida",
          longitude: 500,
          category: "Comida",
        })
        .expect(400);
    });
  });

  describe("Orders Endpoints", () => {
    it("POST /api/orders rechaza con 400 Bad Request si la cantidad enviada es 0", async () => {
      await request(app.getHttpServer())
        .post("/api/orders")
        .send({
          consumer_id: "uuid-user",
          pack_id: "uuid-pack",
          quantity: 0,
        })
        .expect(400);
    });
  });

  describe("Auth Endpoints", () => {
    it("POST /api/auth/login rechaza con 400 Bad Request si el email no es valido", async () => {
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: "correo-invalido",
          password: "123",
        })
        .expect(400);
    });
  });
});