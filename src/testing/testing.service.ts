import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../blogs/domain/blog.schema';
import { Post, PostDocument } from '../posts/domain/post.schema';
import { User, UserDocument } from '../users/domain/user.schema';
import { Comment, CommentDocument } from '../comments/domain/comment.schema';

@Injectable()
export class TestingService {
  constructor(
    @InjectModel(Blog.name) private BlogModel: Model<BlogDocument>,
    @InjectModel(Post.name) private PostModel: Model<PostDocument>,
    @InjectModel(User.name) private UserModel: Model<UserDocument>,
    @InjectModel(Comment.name) private CommentModel: Model<CommentDocument>,
  ) {}

  async dataBaseClear(): Promise<boolean> {
    const blogsDeleteResult = await this.BlogModel.deleteMany({});
    const postsDeleteResult = await this.PostModel.deleteMany({});
    const usersDeleteResult = await this.UserModel.deleteMany({});
    const commentsDeleteResult = await this.CommentModel.deleteMany({});

    return (
      blogsDeleteResult.acknowledged &&
      postsDeleteResult.acknowledged &&
      commentsDeleteResult.acknowledged &&
      usersDeleteResult.acknowledged
    );
  }
}
