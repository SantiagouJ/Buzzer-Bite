import { ConflictException, Injectable } from "@nestjs/common";
import { OrderStatus } from "../entities/order.entity";
import { PackEntity, PackStatus } from "../../packs/entities/pack.entity";

@Injectable()
export class OrderRulesService {
  ensureCanBeReserved(pack: PackEntity, quantity: number): void {
    if (pack.status !== PackStatus.AVAILABLE || pack.stock < quantity) {
      throw new ConflictException(
        `Pack with id ${pack.id} cannot reserve ${quantity} units`,
      );
    }
  }

  ensureCanBeClaimed(
    order: { status: OrderStatus; verification_code: string },
    verificationCode: string,
  ): void {
    if (
      order.status !== OrderStatus.RESERVED ||
      order.verification_code !== verificationCode
    ) {
      throw new ConflictException("Order cannot be claimed");
    }
  }

  ensureCanUpdateQuantity(order: { status: OrderStatus }): void {
    if (order.status !== OrderStatus.RESERVED) {
      throw new ConflictException("Only reserved orders can be updated");
    }
  }
}
