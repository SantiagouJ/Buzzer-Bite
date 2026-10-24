import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class PackRulesService {
  ensureDiscountBelowOriginal(original: number, discount: number): void {
    if (discount >= original) {
      throw new BadRequestException(
        "Discount price must be lower than the original price",
      );
    }
  }

  ensurePickupWindow(start: string, end: string): void {
    if (this.toMinutes(end) <= this.toMinutes(start)) {
      throw new BadRequestException(
        "Pickup end must be later than pickup start",
      );
    }
  }

  private toMinutes(value: string): number {
    const [hours, minutes] = value.split(":").map(Number);

    return hours * 60 + minutes;
  }
}
