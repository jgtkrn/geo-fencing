import { IsNotEmpty, IsOptional } from 'class-validator';

export class UserSearchCompany {
  @IsOptional()
  companyId: string;

  @IsOptional()
  name: string;

  @IsOptional()
  roles: string;

  @IsOptional()
  employmentStatus: string;

  @IsOptional()
  approvalExpenses: number;

  @IsOptional()
  payrollStatus: string;

  @IsOptional()
  region: string;
}
