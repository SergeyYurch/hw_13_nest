import { Injectable } from '@nestjs/common';
import { User } from './domain/user.schema';

@Injectable()
export class UsersRepository {
  async save(user): Promise<User> {
    return user.save();
  }
}
