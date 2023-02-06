import { Model } from 'mongoose';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from './domain/blog.schema';
import { BlogInputModel } from './dto/blogInputModel';
import { BlogViewModel } from './view-models/blogViewModel';
import { BlogsRepository } from './blogs.repository';
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
  constructor(
    @InjectModel(Blog.name) private BlogModel: Model<BlogDocument>,
    private blogRepository: BlogsRepository,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}

  // async createNewBlog(inputBlogDto: BlogInputModel): Promise<BlogViewModel> {
  //   const createdBlog = await this.blogRepository.createBlogModel();
  //   createdBlog.initial(inputBlogDto);
  //   // const factory = new factory();
  //   // const blog = factory.createBlog(dto);
  //   const newBlog = await this.blogRepository.save(createdBlog);
  //   return this.blogsQueryRepository.getBlogById(newBlog._id.toString());
  // }

  // async editBlog(blogId: string, changes: BlogInputModel): Promise<boolean> {
  //   const editBlog = await this.blogRepository.getBlogModel(blogId);
  //   editBlog.blogUpdate(changes);
  //   return !!(await this.blogRepository.save(editBlog));
  // }

  // async deleteBlog(blogId: string): Promise<boolean> {
  //   return this.blogRepository.deleteBlog(blogId);
  // }

  async checkBlogOwner(blogId: string, userId: string) {
    const owner = await this.blogsQueryRepository.getBlogOwner(blogId);
    if (owner.userId === userId) {
      throw new ForbiddenException('Forbidden');
    }
  }
}
