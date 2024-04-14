import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controller/users.controller';
import { UserRepository } from './repository/user.repository';
import { User, UserSchema } from './schemas/user.schema';
import { Income, IncomeSchema } from 'src/income/schema/income.schema';
import {
  OffBoarding,
  OffBoardingSchema,
} from 'src/offboarding/schema/offboarding.schema';
import { Company, CompanySchema } from 'src/company/schemas/company.schema';
import { CompanyModule } from 'src/company/company.module';
import { Schedule, ScheduleSchema } from 'src/schedule/schema/schedule.schema';
import { Project, ProjectSchema } from 'src/project/schema/project.schema';
import { ProjectModule } from 'src/project/project.module';
import { FileuploadModule } from 'src/fileupload/fileupload.module';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { TimetrackingModule } from 'src/timetracking/timetracking.module';
import { MailModule } from 'src/mail/mail.module';
import { TimeManagementModules } from '../helper/timemanagement/timemanagement';
import {
  TimeTracking,
  TimeTrackingSchema,
} from 'src/timetracking/schema/timetracking.schema';
import { IdlehistoryModule } from 'src/idlehistory/idlehistory.module';
import {
  Deduction,
  DeductionSchema,
} from 'src/deduction/schema/deduction.schema';
import { JwtHelperModule } from 'src/utils/helper/jwt/jwt.module';
import {
  Masterdropdown,
  MasterdropdownSchema,
} from 'src/masterdropdown/schemas/masterdropdown.schema';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/subscription/schema/subscription.schema';
import { LeaveModule } from 'src/leave/leave.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { OffboardingModule } from 'src/offboarding/offboarding.module';

@Module({
  imports: [
    ProjectModule,
    CompanyModule,
    FileuploadModule,
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    MongooseModule.forFeature([{ name: Income.name, schema: IncomeSchema }]),
    MongooseModule.forFeature([
      { name: OffBoarding.name, schema: OffBoardingSchema },
    ]),
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
    MongooseModule.forFeature([
      { name: TimeTracking.name, schema: TimeTrackingSchema },
    ]),
    MongooseModule.forFeature([
      { name: Deduction.name, schema: DeductionSchema },
    ]),
    MongooseModule.forFeature([
      { name: Masterdropdown.name, schema: MasterdropdownSchema },
    ]),
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    NestjsFormDataModule,
    TimetrackingModule,
    MailModule,
    TimeManagementModules,
    IdlehistoryModule,
    JwtHelperModule,
    LeaveModule,
    SubscriptionModule,
  ],
  providers: [UsersService, UserRepository, TimeManagementModules],
  controllers: [UsersController],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
