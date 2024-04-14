import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Max,
  Min,
} from 'class-validator';
import { Schema as MongooseSchema } from 'mongoose';
import { Role } from '../schemas/user-role';
import { UserStatus } from '../schemas/user.enum';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType } from '../schemas/user.payment';
import { ProbationType } from '../schemas/user.probation';
import { TerminationStatus } from '../../offboarding/enum/offboarding.enum';
import { IncomeCreateDto } from 'src/income/dto/incomeCreate.dto';

export class UserCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsOptional()
  // @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  emailEmployee: string;

  @ApiProperty()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  salary: number;

  @ApiProperty()
  @IsNotEmpty()
  salaryCurrency: string;

  @ApiProperty()
  @IsOptional()
  address: string;

  @ApiProperty()
  @IsOptional()
  country: string;

  @ApiProperty()
  @IsOptional()
  region: string;

  @ApiProperty()
  @IsOptional()
  postalCode: string;

  @ApiProperty()
  @IsOptional()
  phone: string;

  @ApiProperty()
  @IsOptional()
  position: string;

  @ApiProperty()
  @IsOptional()
  // @IsDateString()
  joinDate: MongooseSchema.Types.Date;

  @ApiProperty()
  @IsOptional()
  // @IsDateString()
  probationDate: MongooseSchema.Types.Date;

  @ApiProperty()
  @IsOptional()
  // @IsDateString()
  birthDate: MongooseSchema.Types.Date;

  @ApiProperty()
  @IsOptional()
  // CAPW-968 - optional for create user for now
  // @IsIn(Object.values(UserStatus))
  employmentStatus: UserStatus;

  @ApiProperty()
  @IsOptional()
  // @IsMongoId()
  bankId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @IsOptional()
  bankAccount: string;

  @ApiProperty()
  @IsOptional()
  basicSalary: string;

  @ApiProperty({ required: false })
  @IsOptional()
  otherIncome?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  // CAPW-968 - optional for create user for now
  // @IsIn(Object.values(PaymentType))
  typePayment: string;

  @ApiProperty({ required: false })
  @IsOptional()
  // CAPW-968 - optional for create user for now
  // @IsIn(Object.values(ProbationType))
  probationStatus: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  basicWageHour: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  maximumWageMonth: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  totalMonthlyIncome: number;

  @ApiProperty()
  @IsOptional()
  @Min(1)
  @Max(24)
  @Type(() => Number)
  weeklyHours: number;

  @ApiProperty({ required: false })
  @IsOptional()
  schedules?: any;

  @ApiProperty()
  @IsNotEmpty()
  @IsIn(Object.values(Role))
  roles: Role;

  @ApiProperty()
  @IsOptional()
  assignedProject?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  photoLink?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  teamId?: string;

  @ApiProperty()
  @IsNotEmpty()
  managerId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ required: false })
  // @IsMongoId()
  @IsOptional()
  companyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isIdle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isPlaying?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isLogout?: string;

  @ApiProperty({ required: false })
  // @IsDateString()
  @IsOptional()
  lastLoginAt?: MongooseSchema.Types.Date;

  @ApiProperty({ required: false })
  // @IsDateString()
  @IsOptional()
  lastActiveAt?: MongooseSchema.Types.Date;

  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  createdBy: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  updatedBy: MongooseSchema.Types.ObjectId;

  @ApiProperty({ required: false })
  @IsOptional()
  password?: string;

  @ApiProperty()
  @IsOptional()
  // CAPW-968 - optional for create user for now
  // @IsIn(Object.values(TerminationStatus))
  terminationStatus: TerminationStatus;

  @ApiProperty()
  @IsOptional()
  remarks: string;

  @ApiProperty()
  @IsOptional()
  // @IsDateString()
  lastDayWork: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isDeleted?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  isFirstLogin?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  incomes?: IncomeCreateDto[];

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  screenshot_option: boolean;

  @ApiProperty()
  @IsNotEmpty()
  leaveEntitlement: number;
}