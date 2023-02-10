import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../domain/user.schema';
import { Model, Types } from 'mongoose';
import { CommandHandler } from '@nestjs/cqrs';

export class DeleteUserCommand {
  constructor(public userId: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase {
  constructor(@InjectModel(User.name) private UserModel: Model<UserDocument>) {}

  async execute(command: DeleteUserCommand): Promise<boolean> {
    const result = await this.UserModel.deleteOne({
      _id: new Types.ObjectId(command.userId),
    });
    return result.deletedCount === 1;
  }
}
