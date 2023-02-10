import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { pagesCount } from '../common/helpers/helpers';
import { PaginatorInputType } from '../common/inputModels/paginatorInputType';
import { User, UserDocument } from './domain/user.schema';
import { UserViewModel } from './view-models/userViewModel';
import { MeViewModel } from '../common/view-models/meViewModel';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectModel(User.name) private UserModel: Model<UserDocument>) {}

  async checkUserId(userId: string): Promise<boolean> {
    return !!(await this.UserModel.findById(userId));
  }

  async findUserByLoginOrEmail(loginOrEmail: string) {
    return await this.UserModel.findOne({
      $or: [
        { 'accountData.email': loginOrEmail },
        { 'accountData.login': loginOrEmail },
      ],
    }).exec();
  }

  async getUserById(id: string): Promise<UserViewModel | null> {
    const user = await this.UserModel.findById(id);
    if (!user) return null;
    return this.getUserViewModel(user);
  }

  async getEmailConfirmationData(userId: string) {
    const user = await this.UserModel.findById(userId);
    if (!user) return null;
    return {
      email: user.accountData.email,
      confirmationCode: user.emailConfirmation.confirmationCode,
      expirationDate: user.emailConfirmation.expirationDate,
    };
  }

  async findUsers(
    paginatorParams: PaginatorInputType,
    searchLoginTerm?: string,
    searchEmailTerm?: string,
    banStatus?: string,
    forSa = false,
  ) {
    const { sortBy, sortDirection, pageSize, pageNumber } = paginatorParams;
    const searchQuery = [];
    let filter = {};
    if (searchLoginTerm)
      searchQuery.push({
        'accountData.login': new RegExp(searchLoginTerm, 'i'),
      });
    if (searchEmailTerm)
      searchQuery.push({
        'accountData.email': new RegExp(searchEmailTerm, 'i'),
      });
    if (banStatus)
      searchQuery.push({
        'banInfo.isBanned': true,
      });
    if (searchQuery.length > 0) filter = { $or: searchQuery };
    const totalCount = await this.UserModel.countDocuments(filter);
    const result = await this.UserModel.find(filter)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .sort({ [`accountData.${sortBy}`]: sortDirection });
    const items: UserViewModel[] = result.map((u) =>
      forSa ? this.getUserSaViewModel(u) : this.getUserViewModel(u),
    );
    return {
      pagesCount: pagesCount(totalCount, pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  getUserViewModel(user: User): UserViewModel {
    return {
      id: user._id.toString(),
      email: user.accountData.email,
      login: user.accountData.login,
      createdAt: user.accountData.createdAt.toISOString(),
    };
  }

  private getUserSaViewModel(user: User) {
    return {
      id: user._id.toString(),
      email: user.accountData.email,
      login: user.accountData.login,
      createdAt: user.accountData.createdAt.toISOString(),
      banInfo: {
        isBanned: user.banInfo.isBanned,
        banDate: user.banInfo.banDate?.toISOString() || null,
        banReason: user.banInfo.banReason,
      },
    };
  }

  async getMeInfo(userId: string) {
    const user = await this.UserModel.findById(userId);
    if (!user) return null;
    return this.getMeViewModel(user);
  }

  getMeViewModel(user: User): MeViewModel {
    return {
      login: user.accountData.login,
      email: user.accountData.email,
      userId: user._id.toString(),
    };
  }
}
