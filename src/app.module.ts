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
import { SecurityDevicesModule } from './security-devices/security-devices.module';
import { QueryModule } from './query/query.module';
import { getMongoConfig } from './configs/mongo.config';
import { TestingModule } from './testing/testing.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { CheckUserIdMiddleware } from './infrastructure/middlewares/check-user-id-middleware.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    configModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getMongoConfig,
    }),
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 5,
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
    AuthModule,
    UsersModule,
    BlogsModule,
    PostsModule,
    CommentsModule,
    SecurityDevicesModule,
    QueryModule,
    TestingModule,
  ],
  providers: [
    JwtService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CheckUserIdMiddleware).forRoutes('posts');
    consumer.apply(CheckUserIdMiddleware).forRoutes('comments');
  }
}
