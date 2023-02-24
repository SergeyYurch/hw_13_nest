import { ForbiddenException, Injectable } from '@nestjs/common';
import { BlogsQueryRepository } from './blogs.query.repository';
//
// @Injectable
// class blogFactory {
//   constructor(   @InjectModel(Blog.name) private BlogModel: Model<BlogDocument>,
//   ) {
//   }
//   createBlog(dto){
//     //logic
//     const blog: BlogDocument = dto
//     return new this.BlogModel(blog)
//   }
// }

@Injectable()
export class BlogsService {
  constructor(private blogsQueryRepository: BlogsQueryRepository) {}

  async checkBlogOwner(blogId: string, userId: string) {
    const owner = await this.blogsQueryRepository.getBlogOwner(blogId);
    if (owner?.userId !== userId) {
      throw new ForbiddenException('Forbidden');
    }
  }

  async isBlogOwner(blogId: string, userId: string) {
    const owner = await this.blogsQueryRepository.getBlogOwner(blogId);
    return owner.userId === userId;
  }
}
