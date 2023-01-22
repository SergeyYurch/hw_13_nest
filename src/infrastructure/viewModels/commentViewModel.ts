import { LikesInfoViewModel } from './likesInfoViewModel';

export interface CommentViewModel {
  id: string;
  content: string;
  userId: string;
  userLogin: string;
  createdAt: string;
  likesInfo: LikesInfoViewModel;
}
