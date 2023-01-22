import { Injectable } from '@nestjs/common';
import { Blog } from '../../domain/schemas/blog.schema';

@Injectable()
export class BlogsRepository {
  async save(blog): Promise<Blog> {
    return blog.save();
  }
}
