import { ForbiddenException } from '@nestjs/common';
import { AuthActor } from './auth-actor';
import { UserRole } from './entities/user.entity';

export function assertRole(actor: AuthActor, role: UserRole): void {
  if (actor.role !== role) {
    throw new ForbiddenException();
  }
}

export function assertSameActor(actorId: string, claimedId: string): void {
  if (actorId !== claimedId) {
    throw new ForbiddenException();
  }
}
