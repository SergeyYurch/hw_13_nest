import { LikesInfoViewModel } from '../../../common/dto/view-models/likes-info.view.model';

export interface BloggerCommentViewModel {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: LikesInfoViewModel;
  postInfo: {
    id: string;
    title: string;
    blogId: string;
    blogName: string;
  };
}
