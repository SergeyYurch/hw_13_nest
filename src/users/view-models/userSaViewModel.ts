import { UserViewModel } from './userViewModel';

export interface UserSaViewModel extends UserViewModel {
  banInfo: {
    isBanned: boolean;
    banDate: string;
    banReason: string;
  };
}
