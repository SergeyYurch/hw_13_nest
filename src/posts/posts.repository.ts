import { Injectable } from '@nestjs/common';
import { Post } from './domain/post.schema';

@Injectable()
export class PostsRepository {
  async save(post): Promise<Post> {
    return post.save();
  }
}
