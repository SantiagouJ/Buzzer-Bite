import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { StoresModule } from '../stores/stores.module';
import { PackEntity } from './entities/pack.entity';
import { PackRulesService } from './pack-rules/pack-rules.service';
import { PacksController } from './packs.controller';
import { PacksService } from './packs.service';

@Module({
  imports: [TypeOrmModule.forFeature([PackEntity]), AuthModule, StoresModule],
  controllers: [PacksController],
  providers: [PacksService, PackRulesService],
  exports: [TypeOrmModule],
})
export class PacksModule {}