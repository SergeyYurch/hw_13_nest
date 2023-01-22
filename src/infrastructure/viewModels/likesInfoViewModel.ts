import { LikeStatusType } from '../../application/inputModels/likeInputModel';

export interface LikesInfoViewModel {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatusType;
}
