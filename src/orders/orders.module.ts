import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PackEntity } from '../packs/entities/pack.entity';
import { OrderEntity } from './entities/order.entity';
import { OrderRulesService } from './order-rules/order-rules.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, PackEntity]), AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRulesService],
  exports: [TypeOrmModule],
})
export class OrdersModule {}
