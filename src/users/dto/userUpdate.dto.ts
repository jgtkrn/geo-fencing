import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsMongoId,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Schema as MongooseSchema } from 'mongoose';
import { Role } from '../schemas/user-role';
import { UserStatus } from '../schemas/user.enum';
import { ProbationType } from '../schemas/user.probation';
import { TerminationStatus } from '../../offboarding/enum/offboarding.enum';

export class UserUpdateDto {
  @IsOptional()
  @IsMongoId()
  id: MongooseSchema.Types.ObjectId;

  @IsOptional()
  name: string;

  @IsOptional()
  email: string;

  @IsOptional()
  @IsEmail()
  emailEmployee: string;

  @IsOptional()
  @Min(1)
  @Type(() => Number)
  salary: number;

  @IsOptional()
  salaryCurrency: string;

  @IsOptional()
  typePayment: string;

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
  // @IsDateString()
  joinDate: MongooseSchema.Types.Date;

  @IsOptional()
  // @IsDateString()
  probationDate: MongooseSchema.Types.Date;

  @IsOptional()
  // @IsDateString()
  birthDate: MongooseSchema.Types.Date;

  @IsOptional()
  // @IsIn(Object.values(ProbationType))
  probationStatus: string;

  @IsOptional()
  employmentStatus: UserStatus;

  @IsOptional()
  bankId: string;

  @IsOptional()
  bankAccount: string;

  @IsOptional()
  basicSalary: string;

  @IsOptional()
  otherIncome: any;

  @IsOptional()
  @Min(1)
  @Max(24)
  @Type(() => Number)
  weeklyHours: number;

  @IsOptional()
  schedules: any;

  @IsOptional()
  roles: Role;

  @IsOptional()
  assignedProject: any;

  @IsOptional()
  photoLink: string;

  // @IsMongoId()
  @IsOptional()
  teamId: string;

  @IsMongoId()
  @IsOptional()
  managerId: MongooseSchema.Types.ObjectId;

  @IsMongoId()
  @IsOptional()
  companyId: MongooseSchema.Types.ObjectId;

  @IsOptional()
  isPlaying?: string;

  @IsOptional()
  lastLoginAt: MongooseSchema.Types.Date;

  @IsOptional()
  lastActiveAt: MongooseSchema.Types.Date;

  @IsMongoId()
  @IsOptional()
  createdBy: MongooseSchema.Types.ObjectId;

  @IsMongoId()
  @IsOptional()
  updatedBy: MongooseSchema.Types.ObjectId;

  @IsOptional()
  password: any;

  @IsOptional()
  salt: any;

  // @IsOptional()
  // @IsIn(Object.values(TerminationStatus))
  // terminationStatus: TerminationStatus;

  @IsOptional()
  terminationStatus: string;

  @IsOptional()
  remarks: string;

  // @IsOptional()
  // @IsDateString()
  // lastDayWork: string;

  @IsOptional()
  lastDayWork: string;

  @IsOptional()
  isDeleted: boolean;

  @IsOptional()
  @Type(() => Number)
  basicWageHour: number;

  @IsOptional()
  @Type(() => Number)
  maximumWageMonth: number;

  @IsOptional()
  @IsBoolean()
  screenshot_option: boolean;

  @IsOptional()
  leaveEntitlement: number;
}