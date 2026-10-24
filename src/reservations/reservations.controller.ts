import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { requestValidationPipe } from "../common/request-validation.pipe";
import { ClaimOrderDto } from "./dto/claim-order.dto";
import { CreateOrderDto } from "./dto/create-reservation.dto";
import { UpdateOrderDto } from "./dto/update-reservation.dto";
import { ReservationsService } from "./reservations.service";

@Controller("reservations")
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Body(requestValidationPipe) createOrderDto: CreateOrderDto) {
    return this.reservationsService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.reservationsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(":id/claim")
  claim(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) claimOrderDto: ClaimOrderDto,
  ) {
    return this.reservationsService.claim(id, claimOrderDto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) updateOrderDto: UpdateOrderDto,
  ) {
    return this.reservationsService.update(id, updateOrderDto);
  }
}
