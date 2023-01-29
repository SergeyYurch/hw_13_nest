import { IsString } from 'class-validator';

export class LoginInputModel {
  @IsString()
  loginOrEmail: string; //*

  @IsString()
  password: string; //*
}
