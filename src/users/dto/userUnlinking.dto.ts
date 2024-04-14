import { IsEmail, IsNotEmpty } from "class-validator";

export class UserUnlinkingDto {
  @IsNotEmpty()
  @IsEmail()
  email: string
}