import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserStatus } from './user.enum';
import { Role } from './user-role';
import { ApiProperty } from '@nestjs/swagger';
import { Task } from 'src/task/schema/task.schema';
import { Project } from 'src/project/schema/project.schema';
import { Income } from 'src/income/schema/income.schema';
import { Deduction } from 'src/deduction/schema/deduction.schema';
import { PaymentType } from './user.payment';
import { ProbationType } from './user.probation';
import { ShippingAddressType } from 'src/types/shippingaddress';

@Schema({
  timestamps: true,
})
export class User extends Document {
  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  _id: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop()
  name: string;

  @ApiProperty()
  @Prop()
  email: string;

  @ApiProperty({ required: false })
  @Prop()
  customerStripeId: string;

  @ApiProperty()
  @Prop()
  emailEmployee: string;

  @ApiProperty()
  @Prop()
  salary: number;

  @ApiProperty()
  @Prop()
  salaryCurrency: string;

  @ApiProperty()
  @Prop()
  address: string;

  @ApiProperty()
  @Prop()
  country: string;

  @ApiProperty()
  @Prop()
  region: string;

  @ApiProperty()
  @Prop()
  postalCode: string;

  @ApiProperty()
  @Prop()
  phone: string;

  @ApiProperty()
  @Prop()
  position: string;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Date })
  joinDate: MongooseSchema.Types.Date;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Date })
  probationDate: MongooseSchema.Types.Date;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Date })
  birthDate: MongooseSchema.Types.Date;

  @ApiProperty()
  @Prop()
  employmentStatus: UserStatus;

  @ApiProperty()
  @Prop()
  bankId: string;

  @ApiProperty()
  @Prop()
  bankAccount: string;

  @ApiProperty()
  @Prop()
  basicSalary: number;

  @ApiProperty({ required: false })
  @Prop({ type: MongooseSchema.Types.Array, ref: 'Income', required: true })
  incomes: Income[];

  @ApiProperty({ required: false })
  @Prop({ type: MongooseSchema.Types.Array, ref: 'Deduction', required: true })
  deductions: Deduction[];

  @Prop()
  otherIncome: any[];

  @ApiProperty({ required: true })
  @Prop({ type: MongooseSchema.Types.String })
  typePayment: string;

  @ApiProperty({ required: true })
  @Prop({ type: MongooseSchema.Types.String })
  probationStatus: string;

  @ApiProperty({ required: false })
  @Prop()
  basicWageHour: number;

  @ApiProperty({ required: false })
  @Prop()
  maximumWageMonth: number;

  @ApiProperty({ required: true })
  @Prop()
  totalMonthlyIncome: number;

  @ApiProperty()
  @Prop()
  weeklyHours: number;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Array, ref: 'Schedule' })
  schedules: any[];

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'OffBoarding' })
  offboarding: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Array, ref: 'ApprovalExpense' })
  approvalExpenses: any[];

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.String, enum: [Role] })
  roles: Role;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Array, ref: 'Project' })
  assignedProject: any[];

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Array, ref: 'User' })
  linkedAccount: any[];

  @ApiProperty({ required: false })
  @Prop()
  photoLink: string;

  @ApiProperty({ required: false })
  @Prop()
  coins: number;

  @ApiProperty({ required: false })
  @Prop({ type: MongooseSchema.Types.Array, ref: 'AvatarAsset' })
  ownedAvatarAsset: MongooseSchema.Types.Array;

  @ApiProperty()
  @Prop()
  avatarImgUrl: string;

  @ApiProperty()
  @Prop()
  teamId: string;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  managerId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company' })
  companyId: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Boolean })
  isPlaying: Boolean;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Boolean })
  isLogout: Boolean;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Boolean })
  isIdle: Boolean;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Boolean, default: false })
  isOffline: Boolean = false;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Date })
  lastLoginAt: MongooseSchema.Types.Date;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Date })
  lastActiveAt: MongooseSchema.Types.Date;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project' })
  lastWorkProjectId: Project;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Task' })
  lastWorkTaskId: Task;

  @ApiProperty({ required: false })
  @Prop({ type: MongooseSchema.Types.Mixed })
  password: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  salt: any;

  @ApiProperty({ required: false })
  @Prop()
  userKey: string;

  @ApiProperty()
  @Prop({ default: true })
  screenshot_option: boolean;

  @ApiProperty()
  @Prop({ default: 12 })
  leaveEntitlement: number;

  @ApiProperty()
  @Prop({ default: 12 })
  leaveBalance: number;

  @ApiProperty()
  @Prop({ default: 12 })
  compensationLeaveEntitlement: number;

  @ApiProperty()
  @Prop({ default: 0 })
  compensationLeaveBalance: number;

  @ApiProperty()
  @Prop({ type: Object })
  shippingAddress: ShippingAddressType;

  @ApiProperty()
  @Prop({ type: Array<MongooseSchema.Types.ObjectId>, ref: 'Product' })
  cart: Array<MongooseSchema.Types.ObjectId>;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId })
  createdBy: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId })
  updatedBy: MongooseSchema.Types.ObjectId;

  @ApiProperty({ required: false })
  @Prop()
  isDeleted: boolean;

  @ApiProperty({ required: false })
  @Prop()
  isFirstLogin: boolean;

  @ApiProperty({ required: false })
  @Prop()
  wasActivated: boolean;

  @ApiProperty({ required: false })
  @Prop({ type: MongooseSchema.Types.Date })
  lastChangePassword: MongooseSchema.Types.Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
