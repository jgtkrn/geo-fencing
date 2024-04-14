import { IsEmail, IsNotEmpty } from "class-validator";

export class UserLinkingDto {
  @IsNotEmpty()
  @IsEmail()
  email: string
}