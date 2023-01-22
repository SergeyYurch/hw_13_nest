import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Blog, BlogSchema } from './domain/schemas/blog.schema';
import { BlogsController } from './api/blogs.controller';
import { BlogsService } from './application/blogs.service';
import { BlogsRepository } from './infrastructure/repositories/blogs.repository';
import { QueryRepository } from './infrastructure/repositories/query.repository';
import { CheckIdMiddleware } from './infrastructure/middlewares/check-id.middleware';
import { PostsService } from './application/posts.service';
import { PostsRepository } from './infrastructure/repositories/posts.repository';
import { PostsController } from './api/posts.controller';
import { Post, PostSchema } from './domain/schemas/post.schema';
import { TestingController } from './api/testing.controller';
import { TestingService } from './application/testing.service';
import { UsersService } from './application/users.service';
import { UsersRepository } from './infrastructure/repositories/users.repository';
import { UsersController } from './api/users.controller';
import { User, UserSchema } from './domain/schemas/user.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGO_URI +
        '/' +
        process.env.DB_NAME +
        '?retryWrites=true&w=majority',
    ),
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    BlogsController,
    PostsController,
    TestingController,
    UsersController,
  ],
  providers: [
    BlogsService,
    BlogsRepository,
    QueryRepository,
    PostsService,
    PostsRepository,
    TestingService,
    UsersService,
    UsersRepository,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CheckIdMiddleware)
      .forRoutes('blogs/:id')
      .apply(CheckIdMiddleware)
      .forRoutes('posts/:id')
      .apply(CheckIdMiddleware)
      .forRoutes('users/:id')
      .apply(CheckIdMiddleware)
      .forRoutes('blogs/:id/posts');
  }
}
