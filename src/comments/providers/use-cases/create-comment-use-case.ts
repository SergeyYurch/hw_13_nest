import { UsersQueryRepository } from '../../../users/providers/users.query.repository';
import { CommentsRepository } from '../comments.repository';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsQueryRepository } from '../../../posts/providers/posts.query.repository';
import { CreatedCommentDto } from '../../dto/created-comment.dto';

export class CreateCommentCommand {
  constructor(
    public content: string,
    public commentatorId: string,
    public postId: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    protected postsQueryRepository: PostsQueryRepository,
    protected commentsRepository: CommentsRepository,
  ) {}

  async execute(command: CreateCommentCommand) {
    const { commentatorId, postId, content } = command;

    const commentator = await this.usersQueryRepository.getUserById(
      commentatorId,
    );
    const post = await this.postsQueryRepository.getPostById(postId);
    const blogOwnerId = await this.postsQueryRepository.getPostsBloggerId(
      postId,
    );
    const createdComment: CreatedCommentDto = {
      content,
      commentatorId,
      commentatorLogin: commentator.login,
      blogId: post.blogId,
      blogName: post.blogName,
      blogOwnerId,
      postId,
      postTitle: post.title,
    };
    const commentModel = await this.commentsRepository.createCommentModel();
    commentModel.initial(createdComment);
    await this.commentsRepository.save(commentModel);
    return await this.commentsRepository.save(commentModel);
  }
}
