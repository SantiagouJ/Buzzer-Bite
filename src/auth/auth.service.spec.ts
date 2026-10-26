import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { QueryFailedError } from "typeorm";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UserEntity } from "./entities/user.entity";

jest.mock("argon2", () => ({
  argon2id: 2,
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;

  let usersRepositoryMock: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
  };

  let jwtServiceMock: {
    signAsync: jest.Mock;
  };

  const mockedArgon2 = argon2 as unknown as {
    hash: jest.Mock;
    verify: jest.Mock;
  };

  beforeEach(async () => {
    usersRepositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOneBy: jest.fn(),
    };

    jwtServiceMock = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: usersRepositoryMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("registra un nuevo usuario hasheando la clave y retornando los datos sin password_hash", async () => {
    const registerDto: RegisterDto = {
      email: "Sergio@BuzzerBite.com",
      password: "password123",
      full_name: "Sergio Arias",
      phone: "3001234567",
      role: "consumer" as any,
    };

    const createdUser = {
      email: "sergio@buzzerbite.com",
      password_hash: "hashed_argon2_password",
      full_name: "Sergio Arias",
      phone: "3001234567",
    };

    const savedUser = {
      id: "user-uuid-1",
      ...createdUser,
      role: "consumer",
    } as unknown as UserEntity;

    mockedArgon2.hash.mockResolvedValue("hashed_argon2_password");
    usersRepositoryMock.create.mockReturnValue(createdUser);
    usersRepositoryMock.save.mockResolvedValue(savedUser);

    const result = await service.register(registerDto);

    expect(mockedArgon2.hash).toHaveBeenCalledWith("password123", {
      type: 2,
    });
    expect(usersRepositoryMock.create).toHaveBeenCalledWith({
      email: "sergio@buzzerbite.com",
      password_hash: "hashed_argon2_password",
      full_name: "Sergio Arias",
      phone: "3001234567",
    });
    expect(usersRepositoryMock.save).toHaveBeenCalledWith(createdUser);
    expect(result).toEqual({
      id: "user-uuid-1",
      email: "sergio@buzzerbite.com",
      full_name: "Sergio Arias",
      phone: "3001234567",
      role: "consumer",
    });
    expect((result as any).password_hash).toBeUndefined();
  });

  it("lanza ConflictException si el email ya esta registrado en la base de datos (error 23505)", async () => {
    const registerDto: RegisterDto = {
      email: "repetido@buzzerbite.com",
      password: "password123",
      full_name: "Usuario Repetido",
      role: "consumer" as any,
    };

    const postgresError = new QueryFailedError(
      "INSERT INTO users...",
      [],
      new Error("duplicate key value violates unique constraint"),
    );
    (postgresError as any).driverError = { code: "23505" };

    mockedArgon2.hash.mockResolvedValue("hash");
    usersRepositoryMock.create.mockReturnValue({});
    usersRepositoryMock.save.mockRejectedValue(postgresError);

    await expect(service.register(registerDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("inicia sesion exitosamente generando un token JWT", async () => {
    const loginDto: LoginDto = {
      email: "sergio@buzzerbite.com",
      password: "password123",
    };

    const userInDb = {
      id: "user-uuid-1",
      email: "sergio@buzzerbite.com",
      password_hash: "valid_hash",
    } as UserEntity;

    usersRepositoryMock.findOneBy.mockResolvedValue(userInDb);
    mockedArgon2.verify.mockResolvedValue(true);
    jwtServiceMock.signAsync.mockResolvedValue("jwt.fake.token");

    const result = await service.login(loginDto);

    expect(usersRepositoryMock.findOneBy).toHaveBeenCalledWith({
      email: "sergio@buzzerbite.com",
    });
    expect(mockedArgon2.verify).toHaveBeenCalledWith("valid_hash", "password123");
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      sub: "user-uuid-1",
    });
    expect(result).toEqual({ access_token: "jwt.fake.token" });
  });

  it("lanza UnauthorizedException en login si el usuario no existe", async () => {
    const loginDto: LoginDto = {
      email: "noexiste@buzzerbite.com",
      password: "password123",
    };

    usersRepositoryMock.findOneBy.mockResolvedValue(null);

    await expect(service.login(loginDto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });

  it("lanza UnauthorizedException en login si la contrasena no coincide", async () => {
    const loginDto: LoginDto = {
      email: "sergio@buzzerbite.com",
      password: "claveIncorrecta",
    };

    const userInDb = {
      id: "user-uuid-1",
      email: "sergio@buzzerbite.com",
      password_hash: "valid_hash",
    } as UserEntity;

    usersRepositoryMock.findOneBy.mockResolvedValue(userInDb);
    mockedArgon2.verify.mockResolvedValue(false);

    await expect(service.login(loginDto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });

  it("obtiene un usuario por ID mediante findEntity", async () => {
    const userInDb = {
      id: "user-uuid-1",
      full_name: "Sergio Arias",
    } as UserEntity;

    usersRepositoryMock.findOneBy.mockResolvedValue(userInDb);

    const result = await service.findEntity("user-uuid-1");

    expect(usersRepositoryMock.findOneBy).toHaveBeenCalledWith({
      id: "user-uuid-1",
    });
    expect(result).toEqual(userInDb);
  });

  it("lanza NotFoundException en findEntity si el usuario no existe", async () => {
    usersRepositoryMock.findOneBy.mockResolvedValue(null);

    await expect(service.findEntity("user-inexistente")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});