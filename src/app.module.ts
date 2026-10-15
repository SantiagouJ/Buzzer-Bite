import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { FavoritesModule } from "./favorites/favorites.module";
import { PacksModule } from "./packs/packs.module";
import { ReservationsModule } from "./reservations/reservations.module";
import { StoresModule } from "./stores/stores.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, //Hace que este modulo sea global y no sea necesario importarlo en cada modulo que se quiera usar
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("DB_HOST") ?? "localhost",
        port: Number(configService.get<string>("DB_PORT") ?? 5433),
        username: configService.get<string>("DB_USERNAME") ?? "postgres",
        password: configService.get<string>("DB_PASSWORD") ?? "postgres",
        database: configService.get<string>("DB_DATABASE") ?? "buzzer_bite",
        autoLoadEntities: true,
        synchronize: false,
        ssl: configService.get<string>("NODE_ENV") === "production",
      }),
    }),
    UsersModule,
    StoresModule,
    FavoritesModule,
    PacksModule,
    ReservationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
