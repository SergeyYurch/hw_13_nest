import { Injectable } from '@nestjs/common';
import { Post } from '../../domain/schemas/post.schema';

@Injectable()
export class UsersRepository {
  async save(user): Promise<Post> {
    return user.save();
  }
}
