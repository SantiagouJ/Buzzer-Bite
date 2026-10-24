import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { StoreEntity } from "./entities/store.entity";
import { StoresController } from "./stores.controller";
import { StoreRulesService } from "./store-rules/store-rules.service";
import { StoresService } from "./stores.service";

@Module({
  imports: [TypeOrmModule.forFeature([StoreEntity]), AuthModule],
  controllers: [StoresController],
  providers: [StoresService, StoreRulesService],
  exports: [TypeOrmModule, StoresService],
})
export class StoresModule {}
