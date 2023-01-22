import { PaginatorInputType } from '../../application/inputModels/paginatorInputType';
import * as bcrypt from 'bcrypt';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
  CONFIRM_EMAIL_LIFE_PERIOD,
  CONFIRM_EMAIL_LIFE_PERIOD_Num,
  RECOVERY_PASSWORD_CODE_LIFE_PERIOD,
} from '../../settings-const';
import add from 'date-fns/add';

export const castQueryParams = (query): PaginatorInputType => {
  const queryParams = new PaginatorInputType();
  queryParams.pageNumber = query.pageNumber ? +query.pageNumber : 1;
  queryParams.pageSize = query.pageSize ? +query.pageSize : 10;
  queryParams.sortBy = query.sortBy ?? 'createdAt';
  queryParams.sortDirection = query.sortDirection ?? 'desc';
  return queryParams;
};

export const pagesCount = (totalCount: number, pageSize: number) =>
  Math.ceil(totalCount / pageSize);

export const generatePassHash = async (
  password: string,
  salt: string,
): Promise<string> => {
  return await hash(password, salt);
};

export const generateHashSalt = async (): Promise<string> => {
  const salt_base = Number(process.env.HASH_SALT_BASE) || 10;
  return await bcrypt.genSalt(salt_base);
};

export const getConfirmationCode = (): string => uuidv4();

export const getConfirmationEmailExpirationDate = () =>
  new Date(CONFIRM_EMAIL_LIFE_PERIOD_Num + Date.now());
// add(new Date(), {
//   [CONFIRM_EMAIL_LIFE_PERIOD.units]: CONFIRM_EMAIL_LIFE_PERIOD.amount,
// });

export const getRecoveryPasswordCodeExpirationDate = () =>
  add(new Date(), {
    [RECOVERY_PASSWORD_CODE_LIFE_PERIOD.units]:
      RECOVERY_PASSWORD_CODE_LIFE_PERIOD.amount,
  });
