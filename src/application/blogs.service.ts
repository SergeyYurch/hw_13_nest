import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../domain/schemas/blog.schema';
import { BlogInputModelDto } from './inputModels/blogInputModel.dto';
import { BlogViewModel } from '../infrastructure/viewModels/blogViewModel';
import { BlogsRepository } from '../infrastructure/repositories/blogs.repository';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private BlogModel: Model<BlogDocument>,
    private blogRepository: BlogsRepository,
  ) {}

  async createNewBlog(blog: BlogInputModelDto): Promise<BlogViewModel> {
    const createdBlog = new this.BlogModel(blog);
    const newBlog = await this.blogRepository.save(createdBlog);
    return newBlog.getViewModel();
  }

  async editBlog(blogId: string, changes: BlogInputModelDto): Promise<boolean> {
    const editBlog = await this.BlogModel.findById(blogId);
    editBlog.changesApply(changes);
    return !!(await this.blogRepository.save(editBlog));
  }

  async deleteBlog(blogId: string): Promise<boolean> {
    const result = await this.BlogModel.deleteOne({
      _id: new Types.ObjectId(blogId),
    });
    return result.deletedCount === 1;
  }
}
