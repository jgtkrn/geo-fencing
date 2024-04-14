import { IsMongoId } from 'class-validator';
export class UserUpdateCompanyId {
  @IsMongoId()
  id: any[];

  @IsMongoId()
  companyId: string;

  @IsMongoId()
  assignedProject : string;
}
