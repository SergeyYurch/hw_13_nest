import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../domain/schemas/blog.schema';
import { Post, PostDocument } from '../domain/schemas/post.schema';
import { User, UserDocument } from '../domain/schemas/user.schema';

@Injectable()
export class TestingService {
  constructor(
    @InjectModel(Blog.name) private BlogModel: Model<BlogDocument>,
    @InjectModel(Post.name) private PostModel: Model<PostDocument>,
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
  ) {}

  async dataBaseClear(): Promise<boolean> {
    const blogsDeleteResult = await this.BlogModel.deleteMany({});
    const postsDeleteResult = await this.PostModel.deleteMany({});
    const usersDeleteResult = await this.UserModel.deleteMany({});
    // const commentsDeleteResult = await this.CommentModel.deleteMany({});
    // const sessionsDeleteResult = await this.SessionModel.deleteMany({});
    // const accessAttemptsDeleteResult = await this.AccessAttemptModel.deleteMany({});
    // const likesDeleteResult = await this.LikeModel.deleteMany({});
    return (
      blogsDeleteResult.acknowledged &&
      postsDeleteResult.acknowledged &&
      usersDeleteResult.acknowledged
    );
    // commentsDeleteResult.acknowledged &&
    // sessionsDeleteResult.acknowledged &&
    // accessAttemptsDeleteResult.acknowledged &&
    // likesDeleteResult.acknowledged
  }
}
