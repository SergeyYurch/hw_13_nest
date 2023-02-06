import { Module } from '@nestjs/common';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { BlogsRepository } from './blogs.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './domain/blog.schema';
import { PostsModule } from '../posts/posts.module';
import { BlogsQueryRepository } from './blogs.query.repository';
import { Post, PostSchema } from '../posts/domain/post.schema';
import { SaBlogsController } from './sa-blogs.controller';
import { UsersModule } from '../users/users.module';
import { CqrsModule } from '@nestjs/cqrs';
import { BindBlogWithUserUseCase } from './use-cases/bind-blog-with-user-use-case';
import { BloggerBlogsController } from './blogger-blogs.controller';
import { CreateNewBlogUseCase } from './use-cases/create-new-blog-use-case';
import { EditBlogUseCase } from './use-cases/edit-blog-use-case';
import { DeleteBlogUseCase } from './use-cases/delete-blog-use-case';

const useCases = [
  BindBlogWithUserUseCase,
  CreateNewBlogUseCase,
  EditBlogUseCase,
  DeleteBlogUseCase,
];

@Module({
  imports: [
    CqrsModule,
    PostsModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
    ]),
  ],
  controllers: [BlogsController, SaBlogsController, BloggerBlogsController],
  providers: [...useCases, BlogsService, BlogsRepository, BlogsQueryRepository],
  exports: [BlogsQueryRepository],
})
export class BlogsModule {}
