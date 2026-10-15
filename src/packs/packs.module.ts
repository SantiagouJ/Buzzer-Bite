import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PackEntity } from "./entities/pack.entity";
import { PacksController } from "./packs.controller";
import { PacksService } from "./packs.service";

@Module({
  imports: [TypeOrmModule.forFeature([PackEntity])],
  controllers: [PacksController],
  providers: [PacksService],
})
export class PacksModule {}
