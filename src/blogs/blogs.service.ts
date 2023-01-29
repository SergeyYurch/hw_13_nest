import { Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from './domain/blog.schema';
import { BlogInputModel } from './dto/blogInputModel';
import { BlogViewModel } from '../query/viewModels/blogViewModel';
import { BlogsRepository } from './blogs.repository';
import { QueryRepository } from '../query/query.repository';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name) private BlogModel: Model<BlogDocument>,
    private blogRepository: BlogsRepository,
    private queryRepository: QueryRepository,
  ) {}

  async createNewBlog(inputBlog: BlogInputModel): Promise<BlogViewModel> {
    const createdBlog = new this.BlogModel(inputBlog);
    const newBlog = await this.blogRepository.save(createdBlog);
    return this.queryRepository.getBlogViewModel(newBlog);
  }

  async editBlog(blogId: string, changes: BlogInputModel): Promise<boolean> {
    const editBlog = await this.BlogModel.findById(blogId);
    editBlog.blogUpdate(changes);
    return !!(await this.blogRepository.save(editBlog));
  }

  async deleteBlog(blogId: string): Promise<boolean> {
    const result = await this.BlogModel.deleteOne({
      _id: new Types.ObjectId(blogId),
    });
    return result.deletedCount === 1;
  }
}
