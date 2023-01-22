import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema()
export class AccountData {
  @Prop({ required: true, default: 'login' })
  login: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  passwordSalt: string;

  @Prop({ default: new Date() })
  createdAt: Date;
}

@Schema()
export class EmailConfirmation {
  @Prop()
  confirmationCode: string;

  @Prop()
  expirationDate: Date;

  @Prop({ default: false })
  isConfirmed: boolean;

  @Prop({ default: [] })
  dateSendingConfirmEmail: Date[];
}

@Schema()
export class PasswordRecoveryInformation {
  @Prop({ required: true })
  recoveryCode: string;

  @Prop({ required: true })
  expirationDate: Date;
}

const AccountDataSchema = SchemaFactory.createForClass(AccountData);
const EmailConfirmationSchema = SchemaFactory.createForClass(EmailConfirmation);
const PasswordRecoveryInformationSchema = SchemaFactory.createForClass(
  PasswordRecoveryInformation,
);

@Schema()
export class User {
  _id: Types.ObjectId;

  @Prop({ type: AccountDataSchema, required: true, _id: false })
  accountData: AccountData;

  @Prop({ type: EmailConfirmationSchema, required: true, _id: false })
  emailConfirmation: EmailConfirmation;

  @Prop({ type: PasswordRecoveryInformationSchema, default: null, _id: false })
  passwordRecoveryInformation: null | PasswordRecoveryInformation;

  getViewModel() {
    return {
      id: this._id.toString(),
      email: this.accountData.email,
      login: this.accountData.login,
      createdAt: this.accountData.createdAt.toISOString(),
    };
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.methods = {
  getViewModel: User.prototype.getViewModel,
};
export type UserDocument = HydratedDocument<User>;
