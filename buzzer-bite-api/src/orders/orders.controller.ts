import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthActor } from "../auth/auth-actor";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/entities/user.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { requestValidationPipe } from "../common/request-validation.pipe";
import { ClaimOrderDto } from "./dto/claim-order.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONSUMER, UserRole.MERCHANT)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CONSUMER)
  create(
    @Req() request: { user: AuthActor },
    @Body(requestValidationPipe) createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(createOrderDto, request.user);
  }

  @Get()
  findAll(@Req() request: { user: AuthActor }) {
    return this.ordersService.findAll(request.user);
  }

  @Get(":id")
  findOne(
    @Req() request: { user: AuthActor },
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.findOne(id, request.user);
  }

  @Patch(":id/claim")
  @Roles(UserRole.MERCHANT)
  claim(
    @Req() request: { user: AuthActor },
    @Param("id", ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) claimOrderDto: ClaimOrderDto,
  ) {
    return this.ordersService.claim(id, claimOrderDto, request.user);
  }

  @Patch(":id")
  @Roles(UserRole.CONSUMER)
  update(
    @Req() request: { user: AuthActor },
    @Param("id", ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateOrderDto, request.user);
  }
}
