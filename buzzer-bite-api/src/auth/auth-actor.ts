import { UserRole } from './entities/user.entity';

export type AuthActor = {
  id: string;
  email: string;
  role: UserRole;
};
