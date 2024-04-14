import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { IncomeCreateDto } from 'src/income/dto/incomeCreate.dto';

export class UserCreateSsoDto {
  @ApiProperty({ required: false })
  @IsOptional()
  _id?: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  position: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  roles: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  companyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  userKey?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  photoLink?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  incomes?: IncomeCreateDto[];

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  screenshot_option: boolean;

  @ApiProperty()
  @IsOptional()
  leaveEntitlement: number;
}
