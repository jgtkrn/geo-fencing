import { IsNotEmpty, IsOptional } from 'class-validator';

export class UserOffboarding {
  @IsOptional()
  terminationStatus: string;
}
