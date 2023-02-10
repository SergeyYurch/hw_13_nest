import { ConfigModule, ConfigService } from '@nestjs/config';
const configModule = ConfigModule.forRoot();

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CheckUserIdMiddleware } from './common/middlewares/check-user-id-middleware.service';
import { JwtService } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersController } from './users/users.controller';
import { BindBlogWithUserUseCase } from './blogs/use-cases/bind-blog-with-user-use-case';
import { CreateNewBlogUseCase } from './blogs/use-cases/create-new-blog-use-case';
import { EditBlogUseCase } from './blogs/use-cases/edit-blog-use-case';
import { DeleteBlogUseCase } from './blogs/use-cases/delete-blog-use-case';
import { CreateNewUserUseCase } from './users/use-cases/create-new-user-use-case';
import { DeleteUserUseCase } from './users/use-cases/delete-user-use-case';
import { CreateNewPostUseCase } from './posts/use-cases/create-new-post-use-case';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './users/domain/user.schema';
import { Blog, BlogSchema } from './blogs/domain/blog.schema';
import { Post, PostSchema } from './posts/domain/post.schema';
import { Comment, CommentSchema } from './comments/domain/comment.schema';
import { getMongoConfig } from './configs/mongo.config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { UsersService } from './users/users.service';
import { UsersRepository } from './users/users.repository';
import { UsersQueryRepository } from './users/users.query.repository';
import { MailService } from './common/mail.service/mail.service';
import { BasicStrategy } from './auth/strategies/auth-basic.strategy';
import { IsBlogExistConstraint } from './posts/common/blog-id-validate';
import { IsUniqLoginOrEmailConstraint } from './users/common/login-or-emai-uniq-validate';
import { AuthController } from './auth/auth.controller';
import { BlogsController } from './blogs/blogs.controller';
import { SaBlogsController } from './blogs/sa-blogs.controller';
import { BloggerBlogsController } from './blogs/blogger-blogs.controller';
import { CommentsController } from './comments/comments.controller';
import { PostsController } from './posts/posts.controller';
import { SecurityController } from './security/security.controller';
import { TestingController } from './testing/testing.controller';
import { LocalStrategy } from './auth/strategies/local.strategy';
import { RefreshTokenStrategy } from './auth/strategies/refresh-token.strategy';
import { AccessTokenStrategy } from './auth/strategies/access-token.strategy';
import { AuthService } from './auth/application/auth.service';
import { BlogsService } from './blogs/blogs.service';
import { BlogsRepository } from './blogs/blogs.repository';
import { BlogsQueryRepository } from './blogs/blogs.query.repository';
import { CommentsService } from './comments/comments.service';
import { CommentsRepository } from './comments/comments.repository';
import { CommentsQueryRepository } from './comments/comments.query.repository';
import { PostsService } from './posts/posts.service';
import { PostsRepository } from './posts/posts.repository';
import { PostsQueryRepository } from './posts/posts.query.repository';
import { SecurityService } from './security/security.service';
import { TestingService } from './testing/testing.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { EditPostUseCase } from './posts/use-cases/edit-post-use-case';
import { UpdatePostLikeStatusUseCase } from './posts/use-cases/update-post-like-status-use-case';
import { DeletePostUseCase } from './posts/use-cases/delete-post-use-case';
import { RegistrationUserUseCase } from './users/use-cases/registration-user-use-case';
import { SaUsersController } from './users/sa-users.controller';
import { BanUserUseCase } from './users/use-cases/ban-user-use-case';
import { CreateCommentUseCase } from './comments/use-cases/create-comment-use-case';
import { DeleteCommentUseCase } from './comments/use-cases/delete-comment-use-case';
import { UpdateCommentUseCase } from './comments/use-cases/update-comment-use-case';
import { UpdateLikeStatusUseCase } from './comments/use-cases/update-like-status-use-case';
import { LogoutUseCase } from './auth/application/use-cases/logout-use-case';
import { PasswordRecoveryUseCase } from './auth/application/use-cases/password-recovery-use-case';
import { RegistrationConfirmationUseCase } from './auth/application/use-cases/registration-confirmation-use-case';
import { RegistrationEmailResendingUseCase } from './auth/application/use-cases/registration-email-resending-use-case';
import { SetNewPasswordUseCase } from './auth/application/use-cases/set-new-password-use-case';
import { SignInUseCase } from './auth/application/use-cases/sign-in-use-case';
import { RefreshTokenUseCases } from './auth/application/use-cases/refresh-token-use-cases';

const blogsUseCases = [
  BindBlogWithUserUseCase,
  CreateNewBlogUseCase,
  EditBlogUseCase,
  DeleteBlogUseCase,
];
const usersUseCases = [
  CreateNewUserUseCase,
  DeleteUserUseCase,
  RegistrationUserUseCase,
  BanUserUseCase,
];
const postsUseCases = [
  EditPostUseCase,
  CreateNewPostUseCase,
  UpdatePostLikeStatusUseCase,
  DeletePostUseCase,
  UpdatePostLikeStatusUseCase,
];

const commentsUseCases = [
  CreateCommentUseCase,
  DeleteCommentUseCase,
  UpdateCommentUseCase,
  UpdateLikeStatusUseCase,
];

const authUseCases = [
  LogoutUseCase,
  PasswordRecoveryUseCase,
  RegistrationConfirmationUseCase,
  RegistrationEmailResendingUseCase,
  SetNewPasswordUseCase,
  SignInUseCase,
  RefreshTokenUseCases,
];

@Module({
  imports: [
    configModule,
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 5,
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getMongoConfig,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          ignoreTLS: true,
          secure: true,
          auth: {
            user: config.get('SMTP_USER'),
            pass: config.get('SMTP_PASS'),
          },
          tls: { rejectUnauthorized: false },
        },
        defaults: {
          from: '"nest-modules" <modules@nestjs.com>',
        },
        template: {
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    CqrsModule,
  ],
  controllers: [
    AuthController,
    UsersController,
    SaUsersController,
    BlogsController,
    SaBlogsController,
    BloggerBlogsController,
    CommentsController,
    PostsController,
    SecurityController,
    TestingController,
  ],

  providers: [
    ...blogsUseCases,
    ...postsUseCases,
    ...usersUseCases,
    ...commentsUseCases,
    ...authUseCases,
    //common
    ConfigService,
    JwtService,
    BasicStrategy,
    LocalStrategy,
    RefreshTokenStrategy,
    AccessTokenStrategy,
    MailService,

    //decorators
    IsBlogExistConstraint,
    IsUniqLoginOrEmailConstraint,

    //auth
    AuthService,

    //blogs
    BlogsService,
    BlogsRepository,
    BlogsQueryRepository,

    //comments
    CommentsService,
    CommentsRepository,
    CommentsQueryRepository,

    //posts
    PostsService,
    PostsRepository,
    PostsQueryRepository,
    BlogsQueryRepository,

    //security
    SecurityService,
    //users
    UsersService,
    UsersRepository,
    UsersQueryRepository,

    //
    TestingService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CheckUserIdMiddleware).forRoutes('posts');
    consumer.apply(CheckUserIdMiddleware).forRoutes('comments');
    consumer.apply(CheckUserIdMiddleware).forRoutes('blogs');
  }
}
