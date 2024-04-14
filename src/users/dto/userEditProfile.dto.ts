import { IsEmail, IsOptional } from 'class-validator';

export class UserEditProfileDto {
  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  address: string;

  @IsOptional()
  phone: string;
}
