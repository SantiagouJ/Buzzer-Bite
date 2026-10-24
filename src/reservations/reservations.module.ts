import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PackEntity } from '../packs/entities/pack.entity';
import { OrderEntity } from './entities/reservation.entity';
import { ReservationRulesService } from './reservation-rules/reservation-rules.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, PackEntity]), AuthModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationRulesService],
  exports: [TypeOrmModule],
})
export class ReservationsModule {}