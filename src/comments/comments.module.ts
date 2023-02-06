import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './domain/comment.schema';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';
import { CommentsQueryRepository } from './comments.query.repository';
import { UsersQueryRepository } from '../users/users.query.repository';
import { User, UserSchema } from '../users/domain/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    CommentsRepository,
    CommentsQueryRepository,
    UsersQueryRepository,
  ],
  exports: [CommentsService, CommentsRepository, CommentsQueryRepository],
})
export class CommentsModule {}
