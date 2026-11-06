import { ConflictException, Injectable } from "@nestjs/common";
import { StoreEntity } from "../entities/store.entity";

@Injectable()
export class StoreRulesService {
  ensureUserHasNoStore(existing: StoreEntity | null, userId: string): void {
    if (existing) {
      throw new ConflictException(
        `User with id ${userId} already has a store`,
      );
    }
  }
}
