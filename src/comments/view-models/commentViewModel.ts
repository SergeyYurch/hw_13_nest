import { LikesInfoViewModel } from '../../common/view-models/likesInfoViewModel';

export interface CommentViewModel {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: LikesInfoViewModel;
}
