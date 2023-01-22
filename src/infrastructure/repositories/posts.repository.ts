import { Injectable } from '@nestjs/common';
import { Post } from '../../domain/schemas/post.schema';

@Injectable()
export class PostsRepository {
  async save(post): Promise<Post> {
    return post.save();
  }
}
