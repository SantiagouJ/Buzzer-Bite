import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/reservation.entity';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [TypeOrmModule],
})
export class ReservationsModule {}