import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendConfirmationEmail(email: string, confirmationCode: string) {
    console.log(`send to ${email} code: ${confirmationCode}`);
    let result = true;
    this.mailerService
      .sendMail({
        to: email,
        from: 'noreply@nestjs.com',
        subject: 'Confirmation email',
        template: 'email',
        context: {
          confirmationCode,
        },
      })
      .then()
      .catch((e) => {
        console.log(e);
        result = false;
      });
    return result;
  }

  async sendPasswordRecoveryEmail(email: string, recoveryCode: string) {
    console.log(`send to ${email} recoveryCode: ${recoveryCode}`);
    let result = true;
    this.mailerService
      .sendMail({
        to: email,
        from: 'noreply@nestjs.com',
        subject: 'Password recovery email',
        template: 'password',
        context: {
          recoveryCode,
        },
      })
      .then()
      .catch((e) => {
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log(e);
        result = false;
      });
    return result;
  }
}
