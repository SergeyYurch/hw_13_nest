import { PostsRepository } from '../posts.repository';
import { BlogsService } from '../../../blogs/providers/blogs.service';
import { BlogPostInputModel } from '../../../blogs/dto/input-models/blog-post.input.model';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class EditPostCommand {
  constructor(
    public userId: string,
    public blogId: string,
    public postId: string,
    public postChanges: BlogPostInputModel,
  ) {}
}

@CommandHandler(EditPostCommand)
export class EditPostUseCase implements ICommandHandler<EditPostCommand> {
  constructor(
    private postRepository: PostsRepository,
    private blogsService: BlogsService,
  ) {}

  async execute(command: EditPostCommand): Promise<boolean> {
    const { userId, blogId, postId, postChanges } = command;
    await this.blogsService.checkBlogOwner(blogId, userId);
    const postModel = await this.postRepository.getPostModelById(postId);
    postModel.updatePost(postChanges);
    const result = await this.postRepository.save(postModel);
    return !!result;
  }
}
