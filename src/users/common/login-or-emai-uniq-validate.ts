import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { QueryRepository } from '../../query/query.repository';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'loginOrEmail', async: true })
@Injectable()
export class IsUniqLoginOrEmailConstraint
  implements ValidatorConstraintInterface
{
  constructor(protected readonly queryRepository: QueryRepository) {}
  async validate(loginOrEmail: string) {
    return !(await this.queryRepository.findUserByLoginOrEmail(loginOrEmail));
  }
}

export function IsUniqLoginOrEmail(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsUniqLoginOrEmailConstraint,
    });
  };
}
