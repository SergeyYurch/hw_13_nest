import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserInputModel } from '../dto/userInputModel';
import {
  getConfirmationCode,
  getConfirmationEmailExpirationDate,
  getPasswordRecoveryCodeExpirationDate,
} from '../../infrastructure/helpers/helpers';

@Schema()
export class AccountData {
  @Prop({ required: true, default: 'login' })
  login: string;

  @Prop({ required: true, unique: true })
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

@Schema()
export class DeviceSessions {
  @Prop({ required: true })
  deviceId: string;
  @Prop({ required: true })
  ip: string;
  @Prop({ required: true })
  title: string;
  @Prop({ required: true })
  lastActiveDate: Date;
  @Prop({ required: true })
  expiresDate: Date;
}

const AccountDataSchema = SchemaFactory.createForClass(AccountData);
const EmailConfirmationSchema = SchemaFactory.createForClass(EmailConfirmation);
const PasswordRecoveryInformationSchema = SchemaFactory.createForClass(
  PasswordRecoveryInformation,
);
const DeviceSessionsSchema = SchemaFactory.createForClass(DeviceSessions);

@Schema()
export class User {
  _id: Types.ObjectId;

  @Prop({ default: false })
  sigIn: boolean;

  @Prop({ type: AccountDataSchema, required: true, _id: false })
  accountData: AccountData;

  @Prop({ type: EmailConfirmationSchema, required: true, _id: false })
  emailConfirmation: EmailConfirmation;

  @Prop({ type: PasswordRecoveryInformationSchema, default: null, _id: false })
  passwordRecoveryInformation: null | PasswordRecoveryInformation;

  @Prop({ type: [DeviceSessionsSchema], default: [], _id: false })
  deviceSessions: DeviceSessions[];

  async setPasswordHash(password: string) {
    this.accountData.passwordSalt = await bcrypt.genSalt(10);
    this.accountData.passwordHash = await bcrypt.hash(
      password,
      this.accountData.passwordSalt,
    );
  }

  async validateCredentials(password: string) {
    const passIsValid = await bcrypt.compare(
      password,
      this.accountData.passwordHash,
    );
    return passIsValid && this.emailConfirmation.isConfirmed;
  }

  async signIn(
    password: string,
    deviceId: string,
    ip: string,
    title: string,
    expiresDate: Date,
    lastActiveDate: Date,
  ) {
    console.log('signIn');
    console.log(lastActiveDate);
    // const passIsValid = await bcrypt.compare(
    //   password,
    //   this.accountData.passwordHash,
    // );
    //
    // if (!passIsValid || !this.emailConfirmation.isConfirmed) {
    //   console.log('bcrypt.compare err');
    //   throw new UnauthorizedException(UNAUTHORIZED_MESSAGE);
    // }
    const deviceSession: DeviceSessions = {
      deviceId,
      ip,
      title,
      lastActiveDate,
      expiresDate,
    };
    this.sigIn = true;
    this.deviceSessions = this.deviceSessions.filter(
      (s) => s.expiresDate > new Date(),
    );
    const session = this.deviceSessions.find((s) => s.deviceId === deviceId);
    if (session) {
      this.deviceSessions = this.deviceSessions.map((s) =>
        s.deviceId === deviceId ? deviceSession : s,
      );
    } else {
      this.deviceSessions.push(deviceSession);
    }
  }

  async validateDeviceSession(deviceId: string, lastActiveDate: number) {
    console.log('validateDeviceSession input');
    console.log(lastActiveDate);
    this.deviceSessions = this.deviceSessions.filter(
      (s) => s.expiresDate > new Date(),
    );
    const deviceSession = this.deviceSessions.find(
      (s) => s.deviceId === deviceId,
    );
    return !!deviceSession && +deviceSession.lastActiveDate === lastActiveDate;
  }

  async logout(deviceId: string) {
    this.sigIn = false;
    this.deviceSessions = this.deviceSessions.filter(
      (s) => s.deviceId !== deviceId,
    );
  }

  async initialize(userDto: UserInputModel, isConfirmed?: boolean) {
    const passwordSalt = await bcrypt.genSalt(10);
    this.accountData = {
      login: userDto.login,
      email: userDto.email,
      passwordSalt,
      passwordHash: await bcrypt.hash(userDto.password, passwordSalt),
      createdAt: new Date(),
    };
    this.emailConfirmation = {
      confirmationCode: getConfirmationCode(),
      expirationDate: getConfirmationEmailExpirationDate(),
      isConfirmed: !!isConfirmed,
      dateSendingConfirmEmail: [new Date()],
    };
  }

  async refreshTokens(deviceId: string, expiresDate: Date) {
    this.deviceSessions = this.deviceSessions.map((s) =>
      s.deviceId === deviceId ? { ...s, expiresDate: expiresDate } : s,
    );
  }

  confirmEmail() {
    this.emailConfirmation.isConfirmed = true;
  }

  async setNewPassword(newPassword) {
    this.accountData.passwordHash = await bcrypt.hash(
      newPassword,
      this.accountData.passwordSalt,
    );
    this.passwordRecoveryInformation = null;
  }

  generateNewEmailConfirmationCode() {
    this.emailConfirmation.confirmationCode = getConfirmationCode();
    this.emailConfirmation.expirationDate =
      getConfirmationEmailExpirationDate();
  }

  generateNewPasswordRecoveryCode() {
    this.passwordRecoveryInformation = {
      recoveryCode: getConfirmationCode(),
      expirationDate: getPasswordRecoveryCodeExpirationDate(),
    };
  }
  getSessions() {
    return this.deviceSessions;
  }
  deleteSessionsExclude(deviceId) {
    this.deviceSessions = this.deviceSessions.filter(
      (s) => s.deviceId === deviceId,
    );
  }

  deleteSession(deviceId) {
    this.deviceSessions = this.deviceSessions.filter(
      (s) => s.deviceId !== deviceId,
    );
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.methods = {
  initialize: User.prototype.initialize,
  setPasswordHash: User.prototype.setPasswordHash,
  signIn: User.prototype.signIn,
  validateDeviceSession: User.prototype.validateDeviceSession,
  logout: User.prototype.logout,
  validateCredentials: User.prototype.validateCredentials,
  refreshTokens: User.prototype.refreshTokens,
  confirmEmail: User.prototype.confirmEmail,
  generateNewEmailConfirmationCode:
    User.prototype.generateNewEmailConfirmationCode,
  generateNewPasswordRecoveryCode:
    User.prototype.generateNewPasswordRecoveryCode,
  setNewPassword: User.prototype.setNewPassword,
  getSessions: User.prototype.getSessions,
  deleteSessionsExclude: User.prototype.deleteSessionsExclude,
  deleteSession: User.prototype.deleteSession,
};
export type UserDocument = HydratedDocument<User>;
