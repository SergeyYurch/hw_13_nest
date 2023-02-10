import { Injectable } from '@nestjs/common';
import { Post, PostDocument } from './domain/post.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Blog, BlogDocument } from '../blogs/domain/blog.schema';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private PostModel: Model<PostDocument>,
    @InjectModel(Blog.name) private BlogModel: Model<BlogDocument>,
  ) {}

  async createModel() {
    return new this.PostModel();
  }
  async delete(postId: string) {
    const result = await this.PostModel.deleteOne({
      _id: new Types.ObjectId(postId),
    });
    return result.deletedCount === 1;
  }

  async findModel(postId: string) {
    return this.PostModel.findById(postId);
  }

  async save(createdPostModel) {
    const newPost = await createdPostModel.save();
    return newPost?._id?.toString();
  }
}
