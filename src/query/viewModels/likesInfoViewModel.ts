import { LikeStatusType } from '../../api/inputModels/likeInputModel';

export interface LikesInfoViewModel {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatusType;
}
