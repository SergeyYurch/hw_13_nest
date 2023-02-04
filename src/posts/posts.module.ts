import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from '../blogs/domain/blog.schema';
import { Post, PostSchema } from './domain/post.schema';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { QueryModule } from '../query/query.module';
import { CommentsModule } from '../comments/comments.module';
import { CommentsService } from '../comments/comments.service';
import { Comment, CommentSchema } from '../comments/domain/comment.schema';
import { CommentsRepository } from '../comments/comments.repository';
import { IsBlogExistConstraint } from './common/blog-validate';

@Module({
  imports: [
    QueryModule,
    CommentsModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Blog.name, schema: BlogSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PostsRepository,
    CommentsService,
    CommentsRepository,
    IsBlogExistConstraint,
  ],
  exports: [PostsService],
})
export class PostsModule {}
