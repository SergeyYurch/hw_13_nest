import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { QueryModule } from '../query/query.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './domain/comment.schema';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';

@Module({
  imports: [
    QueryModule,
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository],
})
export class CommentsModule {}
