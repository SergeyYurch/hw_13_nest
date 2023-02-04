//
import { ConfigModule, ConfigService } from '@nestjs/config';
const configModule = ConfigModule.forRoot();
//
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BlogsModule } from './blogs/blogs.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { QueryModule } from './query/query.module';
import { getMongoConfig } from './configs/mongo.config';
import { TestingModule } from './testing/testing.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { CheckUserIdMiddleware } from './infrastructure/middlewares/check-user-id-middleware.service';
import { JwtService } from '@nestjs/jwt';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    configModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getMongoConfig,
    }),
    // MailerModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     transport: {
    //       host: 'smtp.gmail.com',
    //       port: 465,
    //       ignoreTLS: true,
    //       secure: true,
    //       auth: {
    //         user: config.get('SMTP_USER'),
    //         pass: config.get('SMTP_PASS'),
    //       },
    //       tls: { rejectUnauthorized: false },
    //     },
    //     defaults: {
    //       from: '"nest-modules" <modules@nestjs.com>',
    //     },
    //     template: {
    //       dir: __dirname + '/templates',
    //       adapter: new HandlebarsAdapter(),
    //       options: {
    //         strict: true,
    //       },
    //     },
    //   }),
    // }),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        ignoreTLS: true,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
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
    AuthModule,
    UsersModule,
    BlogsModule,
    PostsModule,
    CommentsModule,
    QueryModule,
    TestingModule,
    SecurityModule,
  ],
  providers: [JwtService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CheckUserIdMiddleware).forRoutes('posts');
    consumer.apply(CheckUserIdMiddleware).forRoutes('comments');
  }
}
