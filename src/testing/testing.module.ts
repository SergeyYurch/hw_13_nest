import { Module } from '@nestjs/common';
import { TestingController } from './testing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from '../blogs/domain/blog.schema';
import { Post, PostSchema } from '../posts/domain/post.schema';
import { User, UserSchema } from '../users/domain/user.schema';
import { TestingService } from './testing.service';
import { Comment, CommentSchema } from '../comments/domain/comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  providers: [TestingService],
  controllers: [TestingController],
})
export class TestingModule {}
