import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/domain/user.schema';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import { QueryModule } from '../query/query.module';
import { QueryRepository } from '../query/query.repository';
import { MailService } from '../infrastructure/mail.service/mail.service';
import { Post, PostSchema } from '../posts/domain/post.schema';
import { Comment, CommentSchema } from '../comments/domain/comment.schema';
import { Blog, BlogSchema } from '../blogs/domain/blog.schema';

@Module({
  imports: [
    QueryModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Blog.name, schema: BlogSchema },
    ]),
  ],
  controllers: [SecurityController],
  providers: [
    SecurityService,
    UsersService,
    UsersRepository,
    QueryRepository,
    MailService,
  ],
})
export class SecurityModule {}
