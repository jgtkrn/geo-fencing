import { IsOptional } from 'class-validator';

export class UserSpesificDto {
  @IsOptional()
  name: string;

  @IsOptional()
  email: string;

  @IsOptional()
  salary: string;

  @IsOptional()
  salaryCurrency: string;

  @IsOptional()
  address: string;

  @IsOptional()
  country: string;

  @IsOptional()
  region: string;

  @IsOptional()
  postalCode: string;

  @IsOptional()
  phone: string;

  @IsOptional()
  position: string;

  @IsOptional()
  joinDate: string;

  @IsOptional()
  employmentStatus: string;

  @IsOptional()
  bankId: string;

  @IsOptional()
  bankAccount: string;

  @IsOptional()
  basicSalary: string;

  @IsOptional()
  otherIncome: string;

  @IsOptional()
  weeklyHours: string;

  @IsOptional()
  schedules: string;

  @IsOptional()
  roles: string;

  assignedProject: string;

  @IsOptional()
  photoLink: string;

  @IsOptional()
  lastLoginAt: string;

  @IsOptional()
  lastActiveAt: string;
}
