import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from '../blogs/domain/blog.schema';
import { Post, PostSchema } from './domain/post.schema';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { CommentsModule } from '../comments/comments.module';
import { Comment, CommentSchema } from '../comments/domain/comment.schema';
import { IsBlogExistConstraint } from './common/blog-id-validate';
import { PostsQueryRepository } from './posts.query.repository';
import { User, UserSchema } from '../users/domain/user.schema';
import { UsersModule } from '../users/users.module';
import { BlogsQueryRepository } from '../blogs/blogs.query.repository';

@Module({
  imports: [
    CommentsModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Blog.name, schema: BlogSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PostsRepository,
    PostsQueryRepository,
    BlogsQueryRepository,
    IsBlogExistConstraint,
  ],
  exports: [PostsService, PostsQueryRepository],
})
export class PostsModule {}
