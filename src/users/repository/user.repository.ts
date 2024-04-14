import { UserStatus } from './../schemas/user.enum';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserCreateDto } from '../dto/userCreate.dto';
import { User } from '../schemas/user.schema';
import { Income } from '../../income/schema/income.schema';
import { OffBoarding } from '../../offboarding/schema/offboarding.schema';
import * as bcrypt from 'bcrypt';
import { UserUpdateDto } from '../dto/userUpdate.dto';
import * as mongoose from 'mongoose';
import { CompanyRepository } from 'src/company/repository/company.repository';
import { UserUpdateCompanyId } from '../dto/userUpdateCompanyId.dto';
import { UserSpesificDto } from '../dto/userSpesific.dto';
import { Schedule } from 'src/schedule/schema/schedule.schema';
import { Project } from 'src/project/schema/project.schema';
import { Company } from 'src/company/schemas/company.schema';
import { ProjectRepository } from 'src/project/repository/project.repository';
import { FileuploadService } from 'src/fileupload/services/fileupload.service';
import { UserEditProfileDto } from '../dto/userEditProfile.dto';
import { TimetrackingService } from 'src/timetracking/services/timetracking.service';
import { UserUpdateAssignedProjectDto } from '../dto/userUpdateAssignedProject.dto';
import { UserCreateSsoDto } from '../dto/userCreateSso.dto';
import { UserSearchCompany } from '../dto/userSearchCompany.dto';
import { UserIsPlayingIdDto } from '../dto/userIsPlaying.dto';
import { PaginationDto } from '../../helper/pagination/dto/pagination.dto';
import { MailService } from 'src/mail/services/mail.service';
import { TimeManagementModules } from '../../helper/timemanagement/timemanagement';
import { JwtDataInterface } from 'src/types/jwt';
import { ResponseApi } from 'src/types/response';
import { IsIdleDto } from 'src/auth/dto/isIdle.dto';
import { TimeTracking } from 'src/timetracking/schema/timetracking.schema';
import { IdlehistoryService } from 'src/idlehistory/service/idlehistory.service';
import { Deduction } from 'src/deduction/schema/deduction.schema';
import { TerminationStatus } from 'src/offboarding/enum/offboarding.enum';
import { IncomeCreateDto } from 'src/income/dto/incomeCreate.dto';
import { log } from 'console';
import { UserLinkingDto } from '../dto/userLinking.dto';
import { UserUnlinkingDto } from '../dto/userUnlinking.dto';
import { Masterdropdown } from 'src/masterdropdown/schemas/masterdropdown.schema';
import { Subscription } from 'src/subscription/schema/subscription.schema';
import { SubscriptionPlan } from 'src/subscription/schema/subscriptionplan.enum';
import { LeaveService } from 'src/leave/services/leave.service';
import { SubscriptionRepository } from 'src/subscription/repository/subscription.repository';
import { Role } from '../schemas/user-role';
import { RegistrationCreateDto } from 'src/subscription/dto/registrationCreate.dto';
import { AccessTokenInterface } from 'src/utils/response/accesstoken.interface';

@Injectable()
export class UserRepository {
  constructor(
    private companyRepository: CompanyRepository,
    private projectRepository: ProjectRepository,
    private timeTrackingService: TimetrackingService,
    private fileUploadService: FileuploadService,
    private mailService: MailService,
    private idleHistoryService: IdlehistoryService,
    private leaveService: LeaveService,
    private subscriptionRepository: SubscriptionRepository,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Income.name)
    private incomeModel: Model<Income>,
    @InjectModel(OffBoarding.name)
    private offBoardingModel: Model<OffBoarding>,
    private timeManagementModules: TimeManagementModules,
    @InjectModel(TimeTracking.name)
    private timeTrackingModel: Model<TimeTracking>,
    @InjectModel(Deduction.name)
    private deductionModel: Model<Deduction>,
    @InjectModel(Masterdropdown.name)
    private masterDropdownModel: Model<Masterdropdown>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    @InjectModel(Company.name)
    private companyModel: Model<Company>,
  ) { }

  /*
   * [====================METHOD FOR UPDATE,CREATE, DELETE DATA=============================]
   */

  // * CREATE User & Password

  async createUser(userCreateDto: UserCreateDto): Promise<User> {
    let newUser = new this.userModel(userCreateDto);
    let updateCompany: any;
    let updateProject: any;
    let response: any;

    //check company subscription
    if (userCreateDto.companyId) {
      const subscriptionWithCompany = await this.subscriptionModel
        .findOne({
          company: userCreateDto.companyId,
        })
        .populate('company', 'users');

      if (
        subscriptionWithCompany &&
        subscriptionWithCompany.subscription_plan == SubscriptionPlan.FREE
      ) {
        // without subscription still bypassed
        const company: any = subscriptionWithCompany.company;
        const userPromises = company.users.map(async (user) => {
          const terminationStatus = await this.offBoardingModel
            .findOne({ userId: user })
            .exec();

          return terminationStatus &&
            terminationStatus.terminationStatus == 'terminate'
            ? null
            : user;
        });

        const usersWithStatus = await Promise.all(userPromises);
        const activeUsers = usersWithStatus.filter((user) => user !== null);
        const totalUser = activeUsers.length;
        if (totalUser >= 3) {
          throw new HttpException(
            {
              status: false,
              statusCode: HttpStatus.BAD_REQUEST,
              response: {
                messageEN: `Only 3 active accounts are allowed on free plan subscription`,
                messageZH: `免费方案订阅仅限三个活跃帐户`,
                messageZhHK: `免費方案訂閱僅限三個活躍帳戶`,
              },
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }
    const existingUser = await this.findByEmail(userCreateDto.emailEmployee);
    let personalEmail = null;
    if (userCreateDto.email && userCreateDto.email !== '') {
      personalEmail = await this.findByEmail(userCreateDto.email);
    }

    const salt = await bcrypt.genSalt();
    const password = await this.subscriptionRepository.generatePassword(8);
    // const password = userCreateDto.password ?? 'Password';
    const newPassword = await bcrypt.hash(password, salt);
    // let id = crypto.randomBytes(20).toString('hex');
    // console.log(id);
    newUser.password = newPassword;
    newUser.salt = salt;
    newUser.isPlaying = false;
    newUser.leaveBalance = newUser.leaveEntitlement;
    if (existingUser) {
      throw new BadRequestException(
        `email ${userCreateDto.emailEmployee} already registered`,
      );
    } else if (
      personalEmail &&
      personalEmail != undefined &&
      personalEmail != ''
    ) {
      throw new BadRequestException(
        `email ${userCreateDto.email} already registered`,
      );
    }
    newUser = await newUser.save();
    newUser = newUser.toObject();
    delete newUser.password;
    delete newUser.salt;
    if (newUser) {
      updateCompany = {
        id: userCreateDto.companyId,
        userId: newUser._id,
      };
      if (userCreateDto.assignedProject != undefined) {
        updateProject = {
          id: userCreateDto.assignedProject,
          userId: newUser._id,
        };
        await this.projectRepository.updateProjectUserId(updateProject);
      }
      await this.companyRepository.updateCompanyUserId(updateCompany);
      await this.mailService.sendAccountEmail(newUser.emailEmployee, password);

      if (userCreateDto.incomes && userCreateDto.incomes.length > 0) {
        const userCreatedBy = await this.userModel.findById(
          userCreateDto.createdBy,
        );
        if (!userCreatedBy) {
          throw new NotFoundException(
            `User CreatedBy Or UpdatedBy with ID ${userCreateDto.createdBy} not found`,
          );
        }
        const userCreatedByName: string = userCreatedBy.name;

        for (const incomeData of userCreateDto.incomes) {
          try {
            const incomeCreateDto: IncomeCreateDto = {
              userId: newUser._id,
              incomeName: incomeData.incomeType,
              incomeType: incomeData.incomeType,
              incomeAmount: incomeData.incomeAmount,
              createdBy: userCreatedByName ?? '',
              updatedBy: userCreatedByName ?? '',
            };
            await this.incomeModel.create(incomeCreateDto);

            // code for smart dropdown (OTHER INCOME TYPE)
            const existOtherIncomeType = await this.masterDropdownModel
              .findOne({
                field: 'other-income-type',
                module: 'employee',
                option: incomeData.incomeType,
                companyId: userCreateDto.companyId,
              })
              .exec();

            if (!existOtherIncomeType) {
              const saveOtherIncomeType = await this.masterDropdownModel.create(
                {
                  field: 'other-income-type',
                  module: 'employee',
                  option: incomeData.incomeType,
                  status: true,
                  companyId: userCreateDto.companyId,
                },
              );
            }
          } catch (error) {
            log(error);
          }
        }
      }

      // code for smart dropdown (POSITION)
      const existPosition = await this.masterDropdownModel
        .findOne({
          field: 'position',
          module: 'employee',
          option: userCreateDto.position,
          companyId: userCreateDto.companyId,
        })
        .exec();

      if (!existPosition) {
        const savePosition = await this.masterDropdownModel.create({
          field: 'position',
          module: 'employee',
          option: userCreateDto.position,
          status: true,
          companyId: userCreateDto.companyId,
        });
      }

      response = {
        status: true,
        data: newUser,
        statusCode: 201,
        message: 'User/Employee Created',
      };
    }

    return response;
  }

  // *Create Or Login SSO User

  async creatOrLoginUser(payload: UserCreateSsoDto): Promise<User | any> {
    const checkApiKey = await this.checkApiKey(payload.apiKey);
    const checkEmail = await this.findByEmail(payload.email);
    const searchCompany = await this.companyRepository.findOneApiKey(
      payload.apiKey,
    );
    let updateCompany: any;
    if (checkApiKey || checkEmail) {
      payload._id = checkEmail._id.toString();
      payload.companyId = searchCompany._id.toString();
      // const user = {
      //   _id: checkApiKey._id.toString(),
      //   name: payload.name,
      //   email: payload.email,
      //   phone: payload.phone,
      //   position: payload.position,
      //   role: payload.role,
      //   companyId: searchCompany._id,
      //   apiKey: payload.apiKey,
      // };
      return payload;
    } else {
      let newUser = new this.userModel(payload);
      const salt = await bcrypt.genSalt();
      const password = 'Password';
      const newPassword = await bcrypt.hash(password, salt);
      newUser.companyId = searchCompany._id;
      newUser.photoLink =
        'https://atech-capacitor.s3.ap-southeast-1.amazonaws.com/dev/ce79b692-49e2-4bd7-910e-21a78e401f43%20-%20profile.png';
      newUser.employmentStatus = UserStatus.full_time;
      newUser.password = newPassword;
      newUser.salt = salt;
      newUser = await newUser.save();
      newUser = newUser.toObject();
      delete newUser.password;
      delete newUser.salt;
      await this.mailService.sendAccountEmail(newUser.email, password);

      updateCompany = {
        id: newUser.companyId,
        userId: newUser._id,
      };
      await this.companyRepository.updateCompanyUserId(updateCompany);

      return newUser;
    }
  }

  // * Update User

  async updateUser(
    id: string,
    userUpdateDto: UserUpdateDto,
    file: Express.Multer.File,
    userMetaData: AccessTokenInterface,
  ): Promise<User> {
    const objectId = mongoose.Types.ObjectId;
    const checkId = new mongoose.Types.ObjectId(id);

    let user: User;
    let response: any;
    const userData = await this.userModel.findById(checkId);
    const terminationStatus = await this.offBoardingModel
      .findOne({ userId: userData._id.toString() })
      .populate(
        'userId',
        ['_id', 'name', 'email', 'phone', 'position'],
        User.name,
      )
      .exec();

    if (userUpdateDto.password) {
      const salt = await bcrypt.genSalt();
      const password = userUpdateDto.password;
      const newPassword = await bcrypt.hash(password, salt);
      userUpdateDto.password = newPassword;
      userUpdateDto.salt = salt;
    }
    user = await this.userModel
      .findOneAndUpdate({ _id: checkId }, userUpdateDto)
      .setOptions({ new: true });

    if (objectId.isValid(checkId)) {
      if (file) {
        const dataLocation = await this.fileUploadService.uploadProfileImage(
          file,
        );

        await this.userModel.updateOne(
          { _id: checkId },
          {
            $set: {
              photoLink: dataLocation.Location,
            },
          },
        );
      }
      if (!user) {
        throw new NotFoundException(
          `The company with this id ${checkId} does not exist`,
        );
      } else {
        let data = await this.userModel.findById({ _id: checkId });
        //validate termination status and remarks
        let terminationStatusNew = null;
        let lastDayWork = null;

        if (
          Object.values(TerminationStatus).includes(
            userUpdateDto.terminationStatus as TerminationStatus,
          )
        ) {
          const terminationStatus = await this.offBoardingModel
            .findOne({ userId: userData._id.toString() })
            .populate(
              'userId',
              ['_id', 'name', 'email', 'phone', 'position'],
              User.name,
            )
            .exec();

          const subscriptionWithCompany = await this.subscriptionModel
            .findOne({
              company: userData.companyId,
            })
            .populate('company', 'users');

          const company: any = subscriptionWithCompany.company;
          let currentTerminationStatus = terminationStatus
            ? terminationStatus.terminationStatus
            : 'still_working';
          if (
            userUpdateDto.terminationStatus === 'terminate' &&
            currentTerminationStatus !== 'terminate'
          ) {
            // If the user is being terminated and was not previously terminated, increment the totalTerminatedUsers
            let company = await this.companyModel.findById(userData.companyId);
            if (company) {
              if (company.totalTerminatedUsers === undefined) {
                company.totalTerminatedUsers = 0;
                await company.save();
              }
              await this.companyModel.findByIdAndUpdate(
                { _id: userData.companyId },
                { $inc: { totalTerminatedUsers: 1 } },
              );
            }
            userData.isDeleted = true;
            await userData.save();
          } else if (
            userUpdateDto.terminationStatus !== 'terminate' &&
            terminationStatus.terminationStatus === 'terminate'
          ) {
            // If the user is being activated and was previously terminated, decrement the totalTerminatedUsers
            let company = await this.companyModel.findById(userData.companyId);
            if (
              company &&
              company.totalTerminatedUsers !== undefined &&
              company.totalTerminatedUsers > 0
            ) {
              await this.companyModel.findByIdAndUpdate(
                { _id: userData.companyId },
                { $inc: { totalTerminatedUsers: -1 } },
              );

              if (userData.isDeleted && !userData.wasActivated) {
                if (company.peakNumbers >= company.users.length) {
                  return;
                }
                await this.companyModel.findByIdAndUpdate(
                  { _id: userData.companyId },
                  { $inc: { peakNumbers: 1 } },
                );
                userData.isDeleted = false;
                userData.wasActivated = true;
                await userData.save();
              }
            }
          }

          const userPromises = company.users.map(async (user) => {
            const terminationStatus = await this.offBoardingModel
              .findOne({ userId: user })
              .exec();

            return terminationStatus &&
              terminationStatus.terminationStatus == 'terminate'
              ? null
              : user;
          });

          const usersWithStatus = await Promise.all(userPromises);
          const activeUsers = usersWithStatus.filter((user) => user !== null);
          const totalUser = activeUsers.length;
          if (
            totalUser >= 3 &&
            userUpdateDto.terminationStatus == 'still_working' &&
            subscriptionWithCompany?.subscription_plan == 'free'
          ) {
            throw new HttpException(
              {
                status: false,
                statusCode: HttpStatus.BAD_REQUEST,
                response: {
                  messageEN: `Cannot change status to still working as there are already 3 active accounts`,
                  messageZH: `Cannot change status to still working as there are already 3 active accounts`,
                  messageZhHK: `Cannot change status to still working as there are already 3 active accounts`,
                },
              },
              HttpStatus.BAD_REQUEST,
            );
          }

          terminationStatusNew = userUpdateDto.terminationStatus;
        }

        const isValidDate = await this.isISO8601Date(userUpdateDto.lastDayWork);
        if (isValidDate) {
          lastDayWork = userUpdateDto.lastDayWork;
        }
        let updateOffboard = await this.offBoardingModel
          .findOneAndUpdate(
            { userId: checkId },
            {
              terminationStatus: terminationStatusNew,
              remarks: userUpdateDto.remarks,
              lastDayWork: lastDayWork,
            },
          )
          .setOptions({ new: true, upsert: true });
        data = data.toObject();
        delete data.password;
        delete data.salt;

        // code for smart dropdown (POSITION)
        const existPosition = await this.masterDropdownModel
          .findOne({
            field: 'position',
            module: 'employee',
            option: userUpdateDto.position,
            companyId: userUpdateDto.companyId,
          })
          .exec();

        if (!existPosition) {
          const savePosition = await this.masterDropdownModel.create({
            field: 'position',
            module: 'employee',
            option: userUpdateDto.position,
            status: true,
            companyId: userUpdateDto.companyId,
          });
        }

        await this.leaveService.updateLeaveBalance(id);

        response = {
          status: true,
          data: data,
          statusCode: 200,
          message: 'User updated',
        };
      }

      return response;
    }
  }

  // * Update Linking User (Multi Company)

  async updateLinkingUser(
    dataToken: JwtDataInterface,
    data: UserLinkingDto,
  ): Promise<ResponseApi> {
    let response: ResponseApi;
    let arrUserLinking: Array<string> = [];
    let arrUserSession: Array<string> = [];
    try {
      // check existing user linking email
      const userLinking = await this.findByEmail(data.email);
      if (!userLinking) {
        throw new HttpException(
          {
            messageEN: `Email is not yet registered`,
            messageZH: `电邮尚未注册`,
            messageZhHK: `電郵尚未註冊`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const userSession = await this.findByEmail(dataToken.email);

      if (String(userLinking.companyId) === String(userSession.companyId)) {
        throw new HttpException(
          {
            messageEN: `Can't connect to the user with same entity`,
            messageZH: `无法与相同公司的使用者连接`,
            messageZhHK: `無法與相同公司的使用者連接`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const userLinkingExistsInUserSession = userSession.linkedAccount.includes(
        String(userLinking._id),
      );
      const userSessionExistsInUserLinking = userLinking.linkedAccount.includes(
        String(userSession._id),
      );

      if (userLinkingExistsInUserSession && userSessionExistsInUserLinking) {
        throw new HttpException(
          {
            messageEN: `${userLinking.email} already linked to ${userSession.email}`,
            messageZH: `${userLinking.email} 已连结至 ${userSession.email}`,
            messageZhHK: `${userLinking.email} 已連結至 ${userSession.email}`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // process linking session user to user
      if (userLinking.linkedAccount) {
        if (
          !userLinking.linkedAccount.includes(String(dataToken._id)) &&
          String(dataToken._id) != ''
        ) {
          arrUserLinking = userLinking.linkedAccount;
          arrUserLinking.push(String(dataToken._id));
        } else {
          arrUserLinking = userLinking.linkedAccount;
        }
      } else {
        arrUserLinking.push(String(dataToken._id));
      }
      // check userSession linked user
      for (const f in userSession.linkedAccount) {
        const checkUserSessionLinkedAccount = await this.userModel.findById(
          userSession.linkedAccount[f],
        );
        if (
          !userLinking.linkedAccount.includes(
            String(userSession.linkedAccount[f]),
          ) &&
          String(checkUserSessionLinkedAccount.companyId) !==
            String(userLinking.companyId)
        ) {
          arrUserLinking.push(String(userSession.linkedAccount[f]));

          const anotherUserSession = await this.userModel.findById(
            userSession.linkedAccount[f],
          );
          let tempAnotherUserSession = anotherUserSession.linkedAccount;
          tempAnotherUserSession.push(String(userLinking._id));
          const updateAnotherUserSession =
            await this.userModel.findOneAndUpdate(
              {
                _id: userSession.linkedAccount[f],
              },
              {
                $set: {
                  linkedAccount: tempAnotherUserSession,
                },
              },
            );
        }
      }
      const updateUserLink = await this.userModel.findOneAndUpdate(
        {
          _id: userLinking._id,
        },
        {
          $set: {
            linkedAccount: arrUserLinking,
          },
        },
      );

      // process linking user to session user
      if (userSession.linkedAccount) {
        if (
          !userSession.linkedAccount.includes(String(userLinking._id)) &&
          String(userLinking._id) != ''
        ) {
          arrUserSession = userSession.linkedAccount;
          arrUserSession.push(String(userLinking._id));
        } else {
          arrUserSession = userSession.linkedAccount;
        }
      } else {
        arrUserSession.push(String(userLinking._id));
      }
      // check user linking
      for (const f in userLinking.linkedAccount) {
        const checkUserLinkingLinkedAccount = await this.userModel.findById(
          userLinking.linkedAccount[f],
        );
        if (
          !userSession.linkedAccount.includes(
            String(userLinking.linkedAccount[f]),
          ) &&
          userLinking.linkedAccount[f] !== String(userSession._id) &&
          String(checkUserLinkingLinkedAccount.companyId) !==
            String(userSession.companyId)
        ) {
          arrUserSession.push(String(userLinking.linkedAccount[f]));

          const anotherUserLinking = await this.userModel.findById(
            userLinking.linkedAccount[f],
          );
          let tempAnotherUserLinking = anotherUserLinking.linkedAccount;
          tempAnotherUserLinking.push(String(userSession._id));
          const updateAnotherUserSession =
            await this.userModel.findOneAndUpdate(
              {
                _id: userLinking.linkedAccount[f],
              },
              {
                $set: {
                  linkedAccount: tempAnotherUserLinking,
                },
              },
            );
        }
      }
      const updateUserSession = await this.userModel.findOneAndUpdate(
        {
          _id: userSession._id,
        },
        {
          $set: {
            linkedAccount: arrUserSession,
          },
        },
      );
      if (updateUserLink && updateUserSession) {
        response = {
          status: true,
          statusCode: 200,
          message: `${data.email} connected with ${dataToken.email}`,
        };
      } else {
        response = {
          status: true,
          statusCode: 500,
          message: `something wrong while updating data`,
        };
      }
      return response;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // * Update Unlinking User (Multi Company)

  async updateUnlinkingUser(
    dataToken: JwtDataInterface,
    data: UserUnlinkingDto,
  ): Promise<ResponseApi> {
    let response: ResponseApi;
    let arrUserUnlinking: Array<string> = [];
    let arrUserSession: Array<string> = [];
    try {
      // check existing user Unlinking email
      const userSession = await this.findByEmail(dataToken.email);
      const userUnlinking = await this.findByEmail(data.email);
      if (!userUnlinking) {
        throw new HttpException(
          {
            messageEN: `Email is not yet registered`,
            messageZH: `电邮尚未注册`,
            messageZhHK: `電郵尚未註冊`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const userUnlinkingExistsInUserSession =
        userSession.linkedAccount.includes(String(userUnlinking._id));
      const userSessionExistsInUserUnlinking =
        userUnlinking.linkedAccount.includes(String(dataToken._id));

      if (
        !userUnlinkingExistsInUserSession &&
        !userSessionExistsInUserUnlinking
      ) {
        throw new HttpException(
          {
            messageEN: `${userUnlinking.email} already unlinked from ${dataToken.email}`,
            messageZH: `${userUnlinking.email} 已解除与 ${dataToken.email} 的连结#`,
            messageZhHK: `${userUnlinking.email} 已解除與 ${dataToken.email} 的連結#`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // process Unlinking session user to user
      if (userUnlinking.linkedAccount) {
        if (
          userUnlinking.linkedAccount.includes(String(dataToken._id)) &&
          String(dataToken._id) != ''
        ) {
          arrUserUnlinking = userUnlinking.linkedAccount.filter(
            (e: string) => e !== String(dataToken._id),
          );
        } else {
          arrUserUnlinking = userUnlinking.linkedAccount;
        }
      }

      const updateUserUnlink = await this.userModel.findOneAndUpdate(
        {
          _id: userUnlinking._id,
        },
        {
          $set: {
            linkedAccount: arrUserUnlinking,
          },
        },
      );
      // process Unlinking user to session user

      if (userSession.linkedAccount) {
        if (
          userSession.linkedAccount.includes(String(userUnlinking._id)) &&
          String(userUnlinking._id) != ''
        ) {
          arrUserSession = userSession.linkedAccount.filter(
            (e: string) => e !== String(userUnlinking._id),
          );
        } else {
          arrUserSession = userSession.linkedAccount;
        }
      }
      const updateUserSession = await this.userModel.findOneAndUpdate(
        {
          _id: userSession._id,
        },
        {
          $set: {
            linkedAccount: arrUserSession,
          },
        },
      );
      if (updateUserUnlink && updateUserSession) {
        response = {
          status: true,
          statusCode: 200,
          message: `${data.email} disconnected with ${dataToken.email}`,
        };
      } else {
        response = {
          status: true,
          statusCode: 500,
          message: `something wrong while updating data`,
        };
      }
      return response;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async isISO8601Date(value: string): Promise<boolean> {
    // ISO 8601 date format regular expression
    const iso8601Regex =
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|([+-]\d{2}:\d{2}))?)?$/;
    return iso8601Regex.test(value);
  }

  // * Update User CompanyId

  async updateCompanyId(
    userUpdateCompanyId: UserUpdateCompanyId,
  ): Promise<any> {
    try {
      let result: any;
      for (let index = 0; index < userUpdateCompanyId.id.length; index++) {
        result = await this.userModel.updateOne(
          {
            _id: userUpdateCompanyId.id[index],
          },
          {
            $set: { companyId: `${userUpdateCompanyId.companyId}` },
            $push: {
              assignedProject: userUpdateCompanyId.assignedProject.toString(),
            },
          },
        );
      }
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async updateIsPlayingId(userIsplayingDto: UserIsPlayingIdDto): Promise<any> {
    let user: User;
    let response: any;
    const checkId = new mongoose.Types.ObjectId(userIsplayingDto.userId);

    try {
      const oldDataUser = await this.userModel
        .findOne({ _id: userIsplayingDto.userId })
        .exec();
      user = await this.userModel.findOneAndUpdate(
        { _id: checkId },
        {
          $set: {
            isPlaying: userIsplayingDto.isPlaying ?? oldDataUser.isPlaying,
          },
        },
      );
      if (user) {
        response = {
          status: true,
          statusCode: 200,
          message: 'Update IsPlaying Success',
        };
      }
      return response;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async updateLastActive(
    id: string,
    updateLastProjectId: string,
    updateLastTaskId: string,
    isLogout: string,
    lastLoginAt: string,
  ): Promise<User> {
    let user: User;
    let response: any;
    const checkId = new mongoose.Types.ObjectId(id);

    try {
      const oldDataUser = await this.userModel.findOne({ _id: id }).exec();
      user = await this.userModel.findOneAndUpdate(
        { _id: checkId },
        {
          $set: {
            lastWorkProjectId:
              updateLastProjectId ?? oldDataUser.lastWorkProjectId,
            lastWorkTaskId: updateLastTaskId ?? oldDataUser.lastWorkTaskId,
            lastActiveAt: Date.now(),
            isLogout: isLogout ?? false,
            lastLoginAt: lastLoginAt ?? oldDataUser.lastLoginAt,
          },
        },
      );
      if (user) {
        if (!isLogout) {
          await this.updatePlaying(String(checkId), true);
        }
        response = {
          status: true,
          statusCode: 200,
          message: 'Update Success',
        };
      }
      return response;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // * update LastActive & LastLogin User
  async updateLogin(id: string, email?: string): Promise<User> {
    let user: User;
    try {
      user = await this.userModel.findOneAndUpdate(
        { _id: id ?? email },
        {
          $set: {
            isLogout: false,
            lastActiveAt: Date.now(),
            lastLoginAt: Date.now(),
          },
        },
      );
      // const tanggal = new Date().toLocaleString();
      // const strTanggal = user.lastLoginAt.toLocaleString();
      // console.log(user.lastActiveAt.toLocaleString());
      // console.log(Date.parse(strTanggal));
      // const Parser = Date.parse(strTanggal);
      // const diffSec = Date.parse(tanggal) - Parser;
      // const newDate = new Date(diffSec);
      // console.log(newDate.getSeconds() < 1800);
      // console.log(Date.parse(tanggal) - Parser);
      return user;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // * update profile user
  async editProfile(
    id: string,
    data: UserEditProfileDto,
    file: Express.Multer.File,
  ): Promise<User> {
    // get old data
    const user = await this.userModel.findById(id);
    //
    let newUpdateUserProfile: User;
    let response: any;
    try {
      if (file) {
        const dataLocation = await this.fileUploadService.uploadProfileImage(
          file,
        );
        newUpdateUserProfile = await this.userModel.findOneAndUpdate(
          {
            _id: id,
          },
          {
            $set: {
              email: data.email ?? user.email,
              phone: data.phone ?? user.phone,
              address: data.address ?? user.address,
              photoLink: dataLocation.Location,
            },
          },
        );
      } else {
        newUpdateUserProfile = await this.userModel.findOneAndUpdate(
          {
            _id: id,
          },
          {
            $set: {
              email: data.email ?? user.email,
              phone: data.phone ?? user.phone,
              address: data.address ?? user.address,
              photoLink: user.photoLink,
            },
          },
        );
      }

      if (newUpdateUserProfile) {
        const data = await this.userModel
          .findById(id, { password: 0, salt: 0 })
          .populate('companyId', ['name', 'address', 'phone'], Company.name)
          .populate('schedules', null, Schedule.name)
          .populate('assignedProject', null, Project.name)
          .exec();
        response = {
          status: true,
          data: data,
          statusCode: 201,
          message: 'Profile Updated',
        };
      }
      return response;
    } catch (error) {}
  }

  // Update Schedule
  async updateNewSchedule(
    userId: string,
    scheduleId: string,
  ): Promise<boolean | object> {
    try {
      const userWithSchedule = await this.userModel.find({
        schedules: scheduleId,
      });

      if (userWithSchedule.length <= 0) {
        const updateSchedule = await this.userModel.updateOne(
          { _id: userId },
          {
            $push: { schedules: `${scheduleId}` },
          },
        );
        return updateSchedule;
      }
    } catch (error) {
      throw new BadRequestException();
    }
  }

  // * Update Playing User

  async updatePlaying(id: string, isPlaying: boolean): Promise<object | any> {
    let response: object;
    const updatePlaying = await this.userModel.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          isPlaying: isPlaying ?? false,
        },
      },
    );
    if (updatePlaying) {
      response = {
        status: true,
        data: null,
        statusCode: 201,
        message: 'Isplaying Updated',
      };
    }
    return response;
  }

  async updateIsIdle(
    dataToken: JwtDataInterface,
    isIdleDto: IsIdleDto,
  ): Promise<ResponseApi> {
    let response: ResponseApi;
    let latestData: any;
    let filter: any;
    try {
      filter = {
        userId: dataToken._id,
        status: {
          $in: ['start', 'in_progress', 'offline'],
        },
      };
      latestData = await this.timeTrackingModel.findOne(filter).sort({
        startTime: 'desc',
      });
      const timetrackingId = latestData?._id;

      // update the idle value
      const updateIdle = await this.userModel.findOneAndUpdate(
        {
          _id: dataToken._id,
        },
        {
          $set: isIdleDto,
        },
        {
          new: true,
        },
      );

      if (isIdleDto.isIdle && latestData) {
        const dataIdleHistory = {
          device: 'web',
          userId: dataToken._id,
          createdBy: dataToken._id,
          updatedBy: dataToken._id,
          timetrackingId,
        };
        // insert history idle
        const saveIdleHistory = await this.idleHistoryService.createIdleHistory(
          dataIdleHistory,
        );
      }

      if (this.updateIsIdle) {
        response = {
          status: true,
          data: updateIdle,
          statusCode: 200,
          message: 'Idle Status Updated',
        };
      }
      return response;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // update False IsPlaying User
  async updateIsPlayingFalse(): Promise<void> {
    try {
      let userData: Array<any> = [];
      let idUserUpdate: Array<any> = [];
      const allTrueUser = await this.userModel.find({
        isPlaying: true,
      });
      if (allTrueUser.length > 0) {
        for (const p of allTrueUser) {
          const lastDataTimetrackerUser =
            await this.timeTrackingService.findLastDataUser(p._id.toString());
          if (lastDataTimetrackerUser.data != null) {
            const gap =
              new Date().getTime() -
              new Date(lastDataTimetrackerUser.data.endTime).getTime();
            // console.log({
            //   endTime: lastDataTimetrackerUser.data.endTime,
            //   gap
            // })
            if (gap >= 1080000) {
              idUserUpdate.push(p._id.toString());
            }
          } else {
            return;
          }
        }
        console.log(idUserUpdate);
      } else {
        return;
      }
      const updateToFalse = await this.userModel.updateMany(
        {
          _id: {
            $in: idUserUpdate,
          },
        },
        {
          $set: {
            isPlaying: false,
          },
        },
      );
      if (updateToFalse) console.log('updated');
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error);
    }
  }

  // update user status employeeStatus to Terminate

  async updateEmployeeStatusOffBoarding(
    userId: string,
  ): Promise<object | boolean> {
    return await this.userModel.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          employmentStatus: UserStatus.terminate,
        },
      },
    );
  }

  async updateAssignedProjectUser(
    payload: UserUpdateAssignedProjectDto,
  ): Promise<Boolean | Object> {
    const userData = await this.userModel.findById(payload.assignedUsers);
    const checkUser = await this.userModel.findOneAndUpdate(
      { _id: payload.assignedUsers },
      {
        $set: {
          assignedProject: payload.projectId ?? userData.assignedProject,
        },
      },
    );
    return checkUser;
  }

  // * Delete User

  async deleteUser(id: string): Promise<User> {
    const deleted = await this.userModel.findByIdAndRemove(id);
    if (deleted) {
      throw new HttpException('User deleted', HttpStatus.OK);
    }
    return deleted;
  }

  // Remove Schedule User
  async removeScheduleUser(idSchedule: string, idUser: string): Promise<any> {
    try {
      const result = await this.userModel.updateOne(
        { _id: idUser },
        {
          $pull: { schedules: { $in: [`${idSchedule}`] } },
        },
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  /*
   * [====================LIST METHOD FOR GET DATA=============================]
   */

  // *Get all Users without populate other document

  async findAll(companyId: string, terminationStatus?: string): Promise<any> {
    const user = await this.userModel
      .find({ companyId: companyId }, { password: 0, salt: 0 })
      .populate('companyId', ['name', 'address', 'phone'], Company.name)
      .populate({
        path: 'schedules',
        populate: { path: 'allocation' },
        select: ['_id', 'startHour', 'endHour', 'day', 'session', 'userId'],
      })
      .populate({
        path: 'assignedProject',
        select: [
          '_id',
          'name',
          'tender',
          'tenderCurrency',
          'description',
          'tenderFile',
          'startDate',
          'endDate',
        ],
        populate: { path: 'tasks' },
      })
      .populate({
        path: 'offboarding',
      });
    try {
      let response: any;
      if (user) {
        response = {
          status: true,
          data: user,
          statusCode: 200,
          message: 'get Users',
        };
        return response;
      }
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async findAllTest(
    companyId: string,
    terminationStatus?: string,
  ): Promise<any> {
    try {
      const aggregationPipeline = [
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
          },
        },
        {
          $lookup: {
            from: 'companies',
            localField: 'companyId',
            foreignField: '_id',
            as: 'companyId',
          },
        },
        {
          $unwind: '$companyId',
        },
        {
          $addFields: {
            assignedScheduleIds: {
              $map: {
                input: '$schedules',
                as: 'scheduleId',
                in: { $toObjectId: '$$scheduleId' },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'schedules',
            localField: 'assignedScheduleIds',
            foreignField: '_id',
            as: 'schedules',
          },
        },
        // try to fix
        {
          $addFields: {
            assignedProjectIds: {
              $map: {
                input: '$assignedProject',
                as: 'projectId',
                in: { $toObjectId: '$$projectId' },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'assignedProjectIds',
            foreignField: '_id',
            as: 'assignedProject',
          },
        },
        {
          $addFields: {
            assignedProject: {
              $map: {
                input: '$assignedProject',
                as: 'project',
                in: {
                  $mergeObjects: [
                    '$$project',
                    {
                      tasks: {
                        $map: {
                          input: '$$project.tasks',
                          as: 'taskId',
                          in: { $toObjectId: '$$taskId' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'tasks',
            localField: 'assignedProject.tasks',
            foreignField: '_id',
            as: 'tasksData',
          },
        },
        {
          $addFields: {
            'assignedProject.tasks': '$tasksData',
          },
        },
        {
          $project: {
            tasksData: 0,
          },
        },
        // Improve Aggregate Performance by Removing Unnecessary Fields CAPW-1080-user-optimize-aggregate-performance
        {
          $project: {
            offboardingData: 0,
            'showUser._id': 0,
          },
        },
        {
          $project: {
            password: 0,
            salt: 0,
            offboardings: 0,
            bankId: 0,
            teamId: 0,
            managerId: 0,
            createdBy: 0,
            updatedBy: 0,
            __v: 0,
            assignedProjectIds: 0,
            assignedScheduleIds: 0,
          },
        },
      ];

      const usersWithOffboarding = await this.userModel.aggregate(
        aggregationPipeline,
      );

      return {
        status: true,
        data: usersWithOffboarding,
        statusCode: 200,
        message: 'Get Users',
      };
    } catch (error) {
      throw new BadRequestException();
    }
  }

  // Old code findAllTest
  // async findAllTest(
  //   companyId: string,
  //   terminationStatus?: string,
  // ): Promise<any> {
  //   try {
  //     const aggregationPipeline = [
  //       {
  //         $match: {
  //           companyId: new mongoose.Types.ObjectId(companyId),
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'companies',
  //           localField: 'companyId',
  //           foreignField: '_id',
  //           as: 'companyId',
  //         },
  //       },
  //       {
  //         $unwind: '$companyId',
  //       },
  //       {
  //         $addFields: {
  //           assignedScheduleIds: {
  //             $map: {
  //               input: '$schedules',
  //               as: 'scheduleId',
  //               in: { $toObjectId: '$$scheduleId' },
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'schedules',
  //           localField: 'assignedScheduleIds',
  //           foreignField: '_id',
  //           as: 'schedules',
  //         },
  //       },
  //       // try to fix
  //       {
  //         $addFields: {
  //           assignedProjectIds: {
  //             $map: {
  //               input: '$assignedProject',
  //               as: 'projectId',
  //               in: { $toObjectId: '$$projectId' },
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'projects',
  //           localField: 'assignedProjectIds',
  //           foreignField: '_id',
  //           as: 'assignedProject',
  //         },
  //       },
  //       {
  //         $addFields: {
  //           assignedProject: {
  //             $map: {
  //               input: '$assignedProject',
  //               as: 'project',
  //               in: {
  //                 $mergeObjects: [
  //                   '$$project',
  //                   {
  //                     tasks: {
  //                       $map: {
  //                         input: '$$project.tasks',
  //                         as: 'taskId',
  //                         in: { $toObjectId: '$$taskId' },
  //                       },
  //                     },
  //                   },
  //                 ],
  //               },
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'tasks',
  //           localField: 'assignedProject.tasks',
  //           foreignField: '_id',
  //           as: 'tasksData',
  //         },
  //       },
  //       {
  //         $addFields: {
  //           'assignedProject.tasks': '$tasksData',
  //         },
  //       },
  //       {
  //         $project: {
  //           tasksData: 0,
  //         },
  //       },
  //       // Improve Aggregate Performance by Removing Unnecessary Fields CAPW-1080-user-optimize-aggregate-performance
  //       // {
  //       //   $lookup: {
  //       //     from: 'offboardings',
  //       //     let: { userId: '$_id' },
  //       //     pipeline: [
  //       //       {
  //       //         $match: {
  //       //           $expr: { $eq: ['$userId', '$$userId'] },
  //       //         },
  //       //       },
  //       //       {
  //       //         $addFields: {
  //       //           isTerminated: { $eq: ['$terminationStatus', 'terminate'] },
  //       //         },
  //       //       },
  //       //     ],
  //       //     as: 'offboardingData',
  //       //   },
  //       // },
  //       // {
  //       //   $addFields: {
  //       //     showUser: {
  //       //       $cond: {
  //       //         if: { $size: '$offboardingData' },
  //       //         then: { $arrayElemAt: ['$offboardingData', 0] },
  //       //         else: null,
  //       //       },
  //       //     },
  //       //   },
  //       // },
  //       // {
  //       //   $match: {
  //       //     $or: [
  //       //       {
  //       //         'offboardingData.isTerminated': {
  //       //           $eq: terminationStatus !== 'terminate',
  //       //         },
  //       //       },
  //       //       {
  //       //         'offboardingData.isTerminated': { $ne: true },
  //       //       },
  //       //       {
  //       //         offboardingData: { $exists: false },
  //       //       },
  //       //     ],
  //       //   },
  //       // },
  //       {
  //         $project: {
  //           offboardingData: 0,
  //           'showUser._id': 0,
  //         },
  //       },
  //       {
  //         $project: {
  //           password: 0,
  //           salt: 0,
  //           offboardings: 0,
  //           bankId: 0,
  //           teamId: 0,
  //           managerId: 0,
  //           createdBy: 0,
  //           updatedBy: 0,
  //           __v: 0,
  //           assignedProjectIds: 0,
  //           assignedScheduleIds: 0,
  //         },
  //       },
  //     ];

  //     const usersWithOffboarding = await this.userModel.aggregate(
  //       aggregationPipeline,
  //     ).explain('executionStats');

  //       return {
  //         status: true,
  //         data: usersWithOffboarding,
  //         statusCode: 200,
  //         message: 'Get Users',

  //     }
  //   } catch (error) {
  //     throw new BadRequestException();
  //   }
  // }

  async findAllCompanyId(
    companyId: string,
    query: PaginationDto,
    param: UserSearchCompany,
  ): Promise<any> {
    let user: any;
    let response: any;
    let { per_page, page, sort_by, sort_dir } = query;
    let sort: any = {};
    if (sort_by != undefined && sort_by != '') {
      sort[`${sort_by}`] = sort_dir
        ? sort_dir.toLowerCase() == 'asc'
          ? 1
          : -1
        : -1;
    } else {
      sort = {
        createdAt: sort_dir ? (sort_dir.toLowerCase() == 'asc' ? 1 : -1) : -1,
      };
    }
    let limit = per_page ? Number(per_page) : 10;
    let skip = page ? Number(page - 1) * Number(per_page) : 0;
    let filter: any = param;
    let filterRoleArray: string[] = [];
    let filterEmploymentStatusArray: string[] = [];
    let filterRegionArray: string[] = [];
    try {
      if (filter.name != undefined) {
        if (filter.name != '')
          filter.name = { $regex: filter.name, $options: 'i' };
      }
      if (
        filter.employmentStatus != undefined &&
        filter.employmentStatus != ''
      ) {
        filterEmploymentStatusArray = filter.employmentStatus.split(',');
        delete filter.employmentStatus;
      }
      if (filter.roles != undefined && filter.roles != '') {
        filterRoleArray = filter.roles.split(',');
        delete filter.roles;
      }
      if (filter.region != undefined && filter.region != '') {
        filterRegionArray = filter.region.split(',');
        delete filter.region;
      }
      if (filter.companyId != undefined && filter.companyId != '') {
        delete filter.companyId;
      }

      let aggregateParam: any = [
        {
          $match: { companyId: new mongoose.Types.ObjectId(companyId) },
        },
        {
          $project: {
            password: 0,
            salt: 0,
            otherIncome: 0,
          },
        },
        {
          $lookup: {
            from: 'companies',
            localField: 'companyId',
            foreignField: '_id',
            as: 'companies',
          },
        },
        {
          $project: {
            'companies.users': 0,
            'companies.projects': 0,
            'companies.paymentDetails': 0,
            'companies.logolink': 0,
            'companies.apiKey': 0,
            'companies.createdBy': 0,
            'companies.updatedBy': 0,
            'companies.createdAt': 0,
            'companies.updatedAt': 0,
            'companies.__v': 0,
          },
        },
        {
          $lookup: {
            from: 'incomes',
            localField: '_id',
            foreignField: 'userId',
            as: 'incomes',
          },
        },
        {
          $lookup: {
            from: 'deductions',
            localField: '_id',
            foreignField: 'userId',
            as: 'deductions',
          },
        },
        {
          $lookup: {
            from: 'approvalexpenses',
            let: {
              userId: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', '$$userId'] },
                      {
                        $gt: [
                          '$createdAt',
                          new Date(this.timeManagementModules.firstDay),
                        ],
                      },
                      {
                        $lt: [
                          '$createdAt',
                          new Date(this.timeManagementModules.lastDay),
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $sort: {
                  startTime: 1,
                },
              },
            ],
            as: 'approvedExpenses',
          },
        },
        {
          $lookup: {
            from: 'payrolls',
            let: {
              userId: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', '$$userId'] },
                      {
                        $eq: [
                          '$paymentPeriod',
                          this.timeManagementModules.thisPaymentPeriod,
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $sort: {
                  startTime: 1,
                },
              },
            ],
            as: 'payrolls',
          },
        },
        {
          $addFields: {
            companyId: { $arrayElemAt: ['$companies', 0] },
            otherIncome: '$incomes',
            payrollStatus: { $arrayElemAt: ['$payrolls.status', 0] },
            scheduleIds: {
              $map: {
                input: '$schedules',
                as: 'schId',
                in: { $toObjectId: '$$schId' },
              },
            },
            projectIds: {
              $map: {
                input: '$assignedProject',
                as: 'proId',
                in: { $toObjectId: '$$proId' },
              },
            },
            approvalExpenses: { $size: '$approvedExpenses' },
          },
        },
        {
          $project: {
            companies: 0,
            schedules: 0,
            assignedProject: 0,
            approvedExpenses: 0,
            payrolls: 0,
          },
        },
        {
          $lookup: {
            from: 'offboardings',
            localField: '_id',
            foreignField: 'userId',
            as: 'offboarding',
          },
        },
        {
          $addFields: {
            offboarding: { $arrayElemAt: ['$offboarding', 0] },
          },
        },
        {
          $lookup: {
            from: 'schedules',
            let: { schedules: '$scheduleIds' },
            pipeline: [
              { $match: { $expr: { $in: ['$_id', '$$schedules'] } } },
              {
                $addFields: {
                  allIds: {
                    $map: {
                      input: '$allocation',
                      as: 'allId',
                      in: { $toObjectId: '$$allId' },
                    },
                  },
                },
              },
              { $project: { allocation: 0 } },
              {
                $lookup: {
                  from: 'allocations',
                  let: { allocation: '$allIds' },
                  pipeline: [
                    { $match: { $expr: { $in: ['$_id', '$$allocation'] } } },
                  ],
                  as: 'allocation',
                },
              },
              {
                $project: {
                  allIds: 0,
                },
              },
            ],
            as: 'schedules',
          },
        },
        {
          $lookup: {
            from: 'projects',
            let: { pid: '$projectIds' },
            pipeline: [
              { $match: { $expr: { $in: ['$_id', '$$pid'] } } },
              {
                $addFields: {
                  taskIds: {
                    $map: {
                      input: '$tasks',
                      as: 'taskId',
                      in: { $toObjectId: '$$taskId' },
                    },
                  },
                },
              },
              { $project: { tasks: 0 } },
              {
                $lookup: {
                  from: 'tasks',
                  let: { tid: '$taskIds' },
                  pipeline: [{ $match: { $expr: { $in: ['$_id', '$$tid'] } } }],
                  as: 'tasks',
                },
              },
              {
                $project: {
                  taskIds: 0,
                },
              },
            ],
            as: 'assignedProject',
          },
        },
        {
          $project: {
            scheduleIds: 0,
            projectIds: 0,
          },
        },
        {
          $match: filter,
        },
      ];
      if (filterEmploymentStatusArray.length > 0) {
        aggregateParam.push({
          $match: { employmentStatus: { $in: filterEmploymentStatusArray } },
        });
      }
      if (filterRoleArray.length > 0) {
        aggregateParam.push({ $match: { roles: { $in: filterRoleArray } } });
      }
      if (filterRegionArray.length > 0) {
        aggregateParam.push({ $match: { region: { $in: filterRegionArray } } });
      }

      // Add a facet stage for calculating total count and pagination
      aggregateParam.push({
        $facet: {
          totalCount: [
            {
              $group: {
                _id: null,
                totalCount: { $sum: 1 },
              },
            },
          ],
          users: [{ $sort: sort }, { $skip: skip }, { $limit: limit }],
        },
      });

      user = (await this.userModel.aggregate(aggregateParam))[0];
      const maxData = user?.totalCount[0]?.totalCount;

      if (user) {
        response = {
          status: true,
          data: user.users,
          meta: {
            maxData: maxData,
            maxPage:
              maxData == 0 ? 1 : limit == 0 ? 1 : Math.ceil(maxData / limit),
            currentPage: page ? Number(page) : 1,
          },
          statusCode: 200,
          message: 'get Users',
        };
        return response;
      }
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async findSimpleListUser(dataToken: JwtDataInterface): Promise<any> {
    let response: ResponseApi;
    let simpleUser: Array<any>;
    try {
      simpleUser = await this.userModel.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(dataToken?.company),
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            photoLink: 1,
            roles: 1,
          },
        },
      ]);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Something problem when query user',
      );
    }

    if (simpleUser.length > 0) {
      return {
        status: true,
        data: simpleUser,
        statusCode: 200,
        message: 'Get Simple User',
      };
    } else {
      return {
        status: false,
        data: [],
        statusCode: 404,
        message: 'No users found',
      };
    }
  }

  // *Get all Users with Populate company document

  async findAllWithCompany(): Promise<User[]> {
    try {
      const user = await this.userModel
        .find({}, { password: 0, salt: 0 })
        .populate('companyId', ['name', 'address', 'phone'], Company.name)
        .populate({
          path: 'schedules',
          populate: { path: 'allocation' },
          select: ['_id', 'startHour', 'endHour', 'day', 'session', 'userId'],
        })
        .populate({
          path: 'assignedProject',
          select: [
            '_id',
            'name',
            'tender',
            'tenderCurrency',
            'description',
            'tenderFile',
            'startDate',
            'endDate',
          ],
          populate: { path: 'tasks' },
        })
        .populate({
          path: 'offboarding',
        });
      let response: any;
      if (user) {
        response = {
          status: true,
          data: user,
          statusCode: 200,
          message: 'get Users with Company',
        };
        return response;
      }
    } catch (error) {
      throw new BadRequestException();
    }
  }

  // * Get user with spesific return field

  async findAllUserSpesific(userSpesificDto: UserSpesificDto): Promise<User[]> {
    try {
      const user = await this.userModel.find({}, [`${userSpesificDto.name}`]);
      let response: any;
      if (user) {
        response = {
          status: true,
          data: user,
          statusCode: 200,
          message: 'get Users Using Spesific Field',
        };
        return response;
      }
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async findByEmail(email: string): Promise<any> {
    return await this.userModel
      .findOne({ $or: [{ emailEmployee: email }, { email: email }] })
      .exec();
  }

  async findOne(id: string): Promise<any> {
    let user: any = {};
    let response: any;
    try {
      user = await this.userModel
        .findById(id, { password: 0, salt: 0 })
        .populate('companyId', ['name', 'address', 'phone'], Company.name)
        .populate({
          path: 'schedules',
          populate: { path: 'allocation' },
          select: ['_id', 'startHour', 'endHour', 'day', 'session', 'userId'],
        })
        .populate({
          path: 'assignedProject',
          select: [
            '_id',
            'name',
            'tender',
            'tenderCurrency',
            'description',
            'tenderFile',
            'startDate',
            'endDate',
          ],
          populate: { path: 'tasks' },
        })
        .populate({
          path: 'lastWorkProjectId',
          select: ['_id', 'name'],
        })
        .populate({
          path: 'lastWorkTaskId',
          select: ['_id', 'name'],
        })
        .populate({
          path: 'offboarding',
        })
        .exec();
    } catch (error) {
      throw new BadRequestException(`invalid objectId ${id}`);
    }

    if (!user) {
      throw new NotFoundException(`The user with this id ${id} does not exist`);
    } else {
      let incomes = await this.incomeModel.find({
        userId: id /*,incomeType: 'other' */,
      });
      let offboarding = await this.offBoardingModel.findOne({ userId: id });
      let deductions = await this.deductionModel.find({ userId: id });
      user.deductions = deductions;
      user.offboarding = null;
      user.otherIncome = [];
      if (incomes.length > 0) {
        user.otherIncome = incomes;
        user.incomes = incomes;
      }
      user = JSON.parse(JSON.stringify(user));
      if (offboarding) {
        user.offboarding = offboarding;
      }

      response = {
        status: true,
        data: user,
        statusCode: 200,
        message: 'Get user',
      };
    }

    return response;
  }

  // async getUserByCredentials(id: string): Promise<object> {

  //   // const totalWorkingToday =
  //   //   await this.timeTrackingService.getTotalWorkingToday(id);
  //   let user: User;
  //   // const totalTaskToday =
  //   //   await this.timeTrackingService.getTotalWorkingTodayBasedTask(id);
  //   let response: any;
  //   const data = {};
  //   try {
  //     user = await this.userModel
  //       .findById(id, { password: 0, salt: 0 })
  //       .populate('companyId', ['name', 'address', 'phone'], Company.name)
  //       .populate({
  //         path: 'schedules',
  //         populate: { path: 'allocation' },
  //         select: ['_id', 'startHour', 'endHour', 'day', 'session', 'userId'],
  //       })
  //       .populate({
  //         path: 'assignedProject',
  //         select: [
  //           '_id',
  //           'name',
  //           'tender',
  //           'tenderCurrency',
  //           'description',
  //           'tenderFile',
  //           'startDate',
  //           'endDate',
  //         ],
  //         populate: { path: 'tasks' },
  //       })
  //       .populate({
  //         path: 'lastWorkProjectId',
  //         select: ['_id', 'name'],
  //       })
  //       .populate({
  //         path: 'lastWorkTaskId',
  //         select: ['_id', 'name'],
  //       })
  //       .populate({
  //         path: 'offboarding',
  //       })
  //       .populate({
  //         path: 'linkedAccount',
  //         select: [
  //           '_id',
  //           'name',
  //         ],
  //         populate: {
  //           path: 'companyId',
  //           select: [
  //             '_id',
  //             'name'
  //           ],
  //         }
  //       })
  //       .exec();
  //   } catch (error) {
  //     throw new BadRequestException(`invalid objectId ${id}`);
  //   }
  //   if (!user) {
  //     throw new NotFoundException(`The user with this id ${id} does not exist`);
  //   } else {
  //     Object.assign(data, {
  //       _id: user._id,
  //       name: user.name,
  //       email: user.email,
  //       salary: user.salary,
  //       salaryCurrency: user.salaryCurrency,
  //       address: user.address,
  //       country: user.country,
  //       region: user.region,
  //       postalCode: user.postalCode,
  //       phone: user.phone,
  //       position: user.position,
  //       joinDate: user.joinDate,
  //       employmentStatus: user.employmentStatus,
  //       bankId: user.bankId,
  //       bankAccount: user.bankAccount,
  //       basicSalary: user.basicSalary,
  //       otherIncome: user.otherIncome,
  //       weeklyHours: user.weeklyHours,
  //       schedules: user.schedules,
  //       roles: user.roles,
  //       assignedProject: user.assignedProject,
  //       photoLink: user.photoLink,
  //       teamId: user.teamId,
  //       managerId: user.managerId,
  //       companyId: user.companyId,
  //       lastLoginAt: user.lastLoginAt,
  //       lastActiveAt: user.lastActiveAt,
  //       createdBy: user.createdBy,
  //       updatedBy: user.updatedBy,
  //       lastWorkProject: user.lastWorkProjectId,
  //       lastWorkTask: user.lastWorkTaskId,
  //       // totalWorkingToday: totalWorkingToday,
  //       // totalDurationTaskId: totalTaskToday,
  //       isPlaying: user.isPlaying,
  //       isLogout: user.isLogout,
  //       isIdle: user.isIdle,
  //       linkedAccount: user.linkedAccount.map((e: any) => {
  //         return {
  //           userId: {
  //             _id: e._id,
  //             name: e.name,
  //           },
  //           companyId: {
  //             _id: e.companyId._id,
  //             name: e.companyId.name,
  //           }
  //         }
  //       }),
  //     });
  //     response = {
  //       status: true,
  //       data: data,
  //       statusCode: 200,
  //       message: 'Get user',
  //     };
  //   }
  //   return response;
  // }

  async getUserByCredentials(id: string): Promise<ResponseApi> {
    let user: any;
    let response: any;
    let aggregateStage: Array<any> = [];
    try {
      aggregateStage = [
        {
          $project: {
            _id: '$_id',
            name: '$name',
            schedules: {
              $map: {
                input: '$schedules',
                as: 'schedule',
                in: { $toObjectId: '$$schedule' },
              },
            },
            email: '$email',
            salary: '$salary',
            salaryCurrency: '$salaryCurrency',
            address: '$address',
            country: '$country',
            region: '$region',
            postalCode: '$postalCode',
            phone: '$phone',
            position: '$position',
            joinDate: '$joinDate',
            employmentStatus: '$employmentStatus',
            bankId: '$bankId',
            bankAccount: '$bankAccount',
            basicSalary: '$basicSalary',
            otherIncome: '$otherIncome',
            weeklyHours: '$weeklyHours',
            roles: '$roles',
            assignedProject: {
              $map: {
                input: '$assignedProject',
                as: 'assignedProject',
                in: { $toObjectId: '$$assignedProject' },
              },
            },
            photoLink: '$photoLink',
            teamId: '$teamId',
            managerId: '$managerId',
            companyId: '$companyId',
            lastLoginAt: '$lastLoginAt',
            lastActiveAt: '$lastActiveAt',
            createdBy: '$createdBy',
            updatedBy: '$updatedBy',
            lastWorkProjectId: '$lastWorkProjectId',
            lastWorkTaskId: '$lastWorkTaskId',
            isPlaying: '$isPlaying',
            isLogout: '$isLogout',
            isIdle: '$isIdle',
            // offboarding: "$offboarding",
            linkedAccount: {
              $map: {
                input: '$linkedAccount',
                as: 'linkedAccount',
                in: { $toObjectId: '$$linkedAccount' },
              },
            },
            leaveEntitlement: '$leaveEntitlement',
            leaveBalance: '$leaveBalance',
            lastChangePassword: '$lastChangePassword',
            compensationLeaveBalance: '$compensationLeaveBalance',
          },
        },
        {
          $lookup: {
            from: 'companies',
            localField: 'companyId',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: '$_id',
                  name: '$name',
                  address: '$address',
                  phone: '$phone',
                },
              },
            ],
            as: 'company',
          },
        },
        {
          $lookup: {
            from: 'schedules',
            localField: 'schedules',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: '$_id',
                  startHour: '$startHour',
                  endHour: '$endHour',
                  day: '$day',
                  session: '$session',
                  userId: '$userId',
                  allocation: {
                    $map: {
                      input: '$allocation',
                      as: 'allocation',
                      in: { $toObjectId: '$$allocation' },
                    },
                  },
                },
              },
              {
                $lookup: {
                  from: 'allocations',
                  localField: 'allocation',
                  foreignField: '_id',
                  pipeline: [
                    {
                      $project: {
                        _id: '$_id',
                        hoursAllocated: '$hoursAllocated',
                        projectId: '$projectId',
                        userId: '$userId',
                      },
                    },
                  ],
                  as: 'allocation',
                },
              },
            ],
            as: 'schedule',
          },
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'assignedProject',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: '$_id',
                  name: '$name',
                  tender: '$tender',
                  tenderCurrency: '$tenderCurrency',
                  description: '$description',
                  tenderFile: '$tenderFile',
                  startDate: '$startDate',
                  endDate: '$endDate',
                  companyId: '$companyId',
                  tasks: {
                    $map: {
                      input: '$tasks',
                      as: 'tasks',
                      in: { $toObjectId: '$$tasks' },
                    },
                  },
                },
              },
              {
                $lookup: {
                  from: 'tasks',
                  localField: 'tasks',
                  foreignField: '_id',
                  pipeline: [
                    {
                      $project: {
                        _id: '$_id',
                        name: '$name',
                        description: '$description',
                        textLink: '$textLink',
                        assignedUsers: '$assignedUsers',
                        startDate: '$startDate',
                        endDate: '$endDate',
                      },
                    },
                  ],
                  as: 'tasks',
                },
              },
            ],
            as: 'project',
          },
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'lastWorkProjectId',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: '$_id',
                  name: '$name',
                },
              },
            ],
            as: 'lastWorkProject',
          },
        },
        {
          $lookup: {
            from: 'tasks',
            localField: 'lastWorkTaskId',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  _id: '$_id',
                  name: '$name',
                },
              },
            ],
            as: 'lastWorkTask',
          },
        },
        // {
        //   $lookup: {
        //     from: "offboardings",
        //     localField: "offboarding",
        //     foreignField: "_id",
        //     as: "offboarding",
        //   }
        // },
        {
          $lookup: {
            from: 'users',
            localField: 'linkedAccount',
            foreignField: '_id',
            pipeline: [
              {
                $lookup: {
                  from: 'companies',
                  localField: 'companyId',
                  foreignField: '_id',
                  pipeline: [
                    {
                      $project: {
                        _id: '$_id',
                        name: '$name',
                      },
                    },
                  ],
                  as: 'company',
                },
              },
              {
                $project: {
                  _id: 0,
                  companyId: {
                    _id: { $arrayElemAt: ['$company._id', 0] },
                    name: { $arrayElemAt: ['$company.name', 0] },
                  },
                  userId: {
                    _id: '$_id',
                    name: '$name',
                    email: '$email',
                    position: '$position',
                    photoLink: '$photoLink',
                  },
                },
              },
            ],
            as: 'linkedAccount',
          },
        },
        {
          $project: {
            _id: '$_id',
            name: '$name',
            email: '$email',
            salary: '$salary',
            salaryCurrency: '$salaryCurrency',
            address: '$address',
            country: '$country',
            region: '$region',
            postalCode: '$postalCode',
            phone: '$phone',
            position: '$position',
            joinDate: '$joinDate',
            employmentStatus: '$employmentStatus',
            bankId: '$bankId',
            bankAccount: '$bankAccount',
            basicSalary: '$basicSalary',
            otherIncome: '$otherIncome',
            weeklyHours: '$weeklyHours',
            schedules: '$schedule',
            roles: '$roles',
            assignedProject: '$project',
            photoLink: '$photoLink',
            teamId: '$teamId',
            managerId: '$managerId',
            companyId: { $arrayElemAt: ['$company', 0] },
            lastLoginAt: '$lastLoginAt',
            lastActiveAt: '$lastActiveAt',
            createdBy: '$createdBy',
            updatedBy: '$updatedBy',
            lastWorkProject: { $arrayElemAt: ['$lastWorkProject', 0] },
            lastWorkTask: { $arrayElemAt: ['$lastWorkTask', 0] },
            isPlaying: '$isPlaying',
            isLogout: '$isLogout',
            isIdle: '$isIdle',
            // offboarding: {$arrayElemAt:["offboarding", 0]},
            linkedAccount: '$linkedAccount',
            leaveEntitlement: '$leaveEntitlement',
            leaveBalance: '$leaveBalance',
            lastChangePassword: '$lastChangePassword',
            compensationLeaveBalance: '$compensationLeaveBalance',
          },
        },
        {
          $match: {
            $expr: {
              $eq: ['$_id', new mongoose.Types.ObjectId(id)],
            },
          },
        },
      ];
      user = await this.userModel.aggregate(aggregateStage);
      if (user[0]) {
        const compId = user[0].companyId._id;
        user[0].assignedProject = user[0].assignedProject.filter(
          (project) => String(project.companyId) == String(compId),
        );
      } else {
        throw new NotFoundException('User is not found.');
      }
      response = {
        status: true,
        data: user[0],
        statusCode: 200,
        message: 'Get user',
      };
      return response;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(`invalid objectId ${id}`);
    }
  }

  async getOnline(
    sort_dir: string,
    project: string,
    company: string,
  ): Promise<any> {
    // force to set default sorting params if not the part of sorting option
    let sorting: any;
    const company_sort = company || '';
    const sort_param = sort_dir || '';
    const lowerIndicator = sort_param.toLowerCase();
    const sorting_option: string[] = ['asc', 'desc', 'ascending', 'descending'];
    if (sorting_option.includes(lowerIndicator)) {
      sorting = lowerIndicator;
    } else {
      sorting = 'asc';
    }

    try {
      if (company_sort !== '') {
        const user = await this.userModel
          .find({ companyId: company_sort }, { password: 0, salt: 0 })
          .sort({ name: sorting })
          .populate('companyId', ['name', 'address', 'phone'], Company.name)
          .populate({
            path: 'schedules',
            populate: { path: 'allocation' },
            select: ['_id', 'startHour', 'endHour', 'day', 'session', 'userId'],
          })
          .populate({
            path: 'assignedProject',
            select: [
              '_id',
              'name',
              'tender',
              'tenderCurrency',
              'description',
              'tenderFile',
              'startDate',
              'endDate',
            ],
            populate: { path: 'tasks' },
          })
          .populate({
            path: 'lastWorkProjectId',
            select: ['_id', 'name'],
          })
          .populate({
            path: 'lastWorkTaskId',
            select: ['_id', 'name'],
          })
          .populate({
            path: 'offboarding',
          })
          .exec();

        const time = [];

        let response: any;
        user.forEach((element) => {
          const newDate = new Date(element.lastActiveAt.toLocaleString());
          const dateJ = new Date().getTime() - newDate.getTime();
          const diffSecond = dateJ / 1000;
          const diffMinute = diffSecond / 60;

          time.push({
            _id: element._id,
            name: element.name,
            position: element.position,
            phone: element.phone,
            email: element.email,
            photoLink: element.photoLink,
            project: element.assignedProject,
            schedules: element.schedules,
            isActive:
              Math.floor(diffMinute) <= 15 && Math.floor(diffMinute) >= 0
                ? true
                : false,
            lastWorkProject: element.lastWorkProjectId,
            lastWorkTask: element.lastWorkTaskId,
            lastActive: `${Math.floor(diffMinute)} minute ago`,
            lastActiveAt: element.lastActiveAt,
            isLogout: element.isLogout,
            isIdle: element.isIdle,
            employmentStatus: element?.employmentStatus,
          });
        });

        // get existing projects name without access to db
        const project_option = [];
        if (time) {
          for (let i = 0; i < time.length; i++) {
            for (let j = 0; j < time[i].project.length; j++) {
              if (project_option.indexOf(time[i].project[j].name) === -1)
                project_option.push(time[i].project[j].name);
            }
          }
        }

        // check project param and define default value of project param if not exist
        let project_name: any;
        const project_param = project || '';
        const project_index = project_option.findIndex((element) => {
          return element.toLowerCase() === project_param.toLowerCase();
        });
        project_name = project_index == -1 ? '' : project_option[project_index];
        // re-sort the time array if project param exist
        let results = [];
        if (project_name === '') results = time;
        for (let i = 0; i < time.length; i++) {
          for (let j = 0; j < time[i].project.length; j++) {
            if (time[i].project[j].name === project_name) results.push(time[i]);
          }
        }

        if (time) {
          response = {
            status: true,
            data: results,
            statusCode: 200,
            message: project_name === '' ? `Get online` : 'Get online',
          };
        }
        return response;
      } else {
        const user = await this.userModel
          .find({}, { password: 0, salt: 0 })
          .sort({ name: sorting })
          .populate('companyId', ['name', 'address', 'phone'], Company.name)
          .populate({
            path: 'schedules',
            populate: { path: 'allocation' },
            select: ['_id', 'startHour', 'endHour', 'day', 'session', 'userId'],
          })
          .populate({
            path: 'assignedProject',
            select: [
              '_id',
              'name',
              'tender',
              'tenderCurrency',
              'description',
              'tenderFile',
              'startDate',
              'endDate',
            ],
            populate: { path: 'tasks' },
          })
          .populate({
            path: 'lastWorkProjectId',
            select: ['_id', 'name'],
          })
          .populate({
            path: 'lastWorkTaskId',
            select: ['_id', 'name'],
          })
          .populate({
            path: 'offboarding',
          })
          .exec();

        const time = [];

        let response: any;
        user.forEach((element) => {
          const newDate = new Date(element.lastActiveAt.toLocaleString());
          const dateJ = new Date().getTime() - newDate.getTime();
          const diffSecond = dateJ / 1000;
          const diffMinute = diffSecond / 60;

          time.push({
            _id: element._id,
            name: element.name,
            position: element.position,
            phone: element.phone,
            email: element.email,
            photoLink: element.photoLink,
            project: element.assignedProject,
            schedules: element.schedules,
            isActive:
              Math.floor(diffMinute) <= 15 && Math.floor(diffMinute) >= 0
                ? true
                : false,
            lastWorkProject: element.lastWorkProjectId,
            lastWorkTask: element.lastWorkTaskId,
            lastActive: `${Math.floor(diffMinute)} minute ago`,
            lastActiveAt: element.lastActiveAt,
            isLogout: element.isLogout,
            isIdle: element.isIdle,
            employmentStatus: element?.employmentStatus,
          });
        });

        // get existing projects name without access to db
        const project_option = [];
        if (time) {
          for (let i = 0; i < time.length; i++) {
            for (let j = 0; j < time[i].project.length; j++) {
              if (project_option.indexOf(time[i].project[j].name) === -1)
                project_option.push(time[i].project[j].name);
            }
          }
        }

        // check project param and define default value of project param if not exist
        let project_name: any;
        const project_param = project || '';
        const project_index = project_option.findIndex((element) => {
          return element.toLowerCase() === project_param.toLowerCase();
        });
        project_name = project_index == -1 ? '' : project_option[project_index];
        // re-sort the time array if project param exist
        let results = [];
        if (project_name === '') results = time;
        for (let i = 0; i < time.length; i++) {
          for (let j = 0; j < time[i].project.length; j++) {
            if (time[i].project[j].name === project_name) results.push(time[i]);
          }
        }

        if (time) {
          response = {
            status: true,
            data: results,
            statusCode: 200,
            message: project_name === '' ? `Get online` : 'Get online',
          };
        }
        return response;
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getApproverExpense(
    managerId: string,
    companyId: string,
  ): Promise<User | any> {
    let arrReturn: Array<any>;
    const manager = await this.userModel
      .findOne({
        _id: managerId,
      })
      .exec();
    const hr = await this.getOneHrUser(companyId);
    if (!hr) {
      return [manager, manager];
    }
    arrReturn = [manager, hr];
    return arrReturn;
  }

  async getOneHrUser(companyId: string): Promise<User> {
    return await this.userModel
      .findOne({
        roles: 'hr',
        companyId,
      })
      .exec();
  }

  async getHrUser(companyId: string): Promise<Array<User> | any> {
    return await this.userModel.find({ roles: 'hr', companyId }).select({
      name: 1,
      email: 1,
      position: 1,
      roles: 1,
    });
  }

  async checkIsManager(userId: string): Promise<User> {
    return await this.userModel.findOne({ managerId: userId });
  }

  async checkPassword(
    password: string,
    hashPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashPassword);
  }

  async checkApiKey(userKey: string): Promise<User> {
    return await this.userModel.findOne({ userKey: userKey }).exec();
  }

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const userCheck = await this.findByEmail(email);
      const checkPassword = await this.checkPassword(
        password,
        userCheck.password,
      );

      if (userCheck && checkPassword) {
        return userCheck;
      } else {
        throw new UnauthorizedException('wrong email or password');
      }
    } catch (error) {
      throw new UnauthorizedException('wrong email or password');
    }
  }

  // Validate AssignedProject in Schedule with Data User
  async checkAssignedProjectSchedule(
    id: string,
    idProject: string,
  ): Promise<User> {
    const userData = await this.userModel.findOne({
      _id: id,
      assignedProject: idProject,
    });
    return userData;
  }

  async setUserOffline(id: string, offline: boolean = false) {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) throw new NotFoundException('User not found.');

      user.isOffline = offline;
      await user.save();
    } catch (error) {
      throw error;
    }
  }

  // create user from public website registration & subscribe
  async createUserSubscription(
    registrationCreateDto: RegistrationCreateDto,
    randomPassword: string,
  ): Promise<User> {
    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(randomPassword, salt);
    let newUser = new this.userModel({
      name: registrationCreateDto.contact_name,
      email: registrationCreateDto.contact_email,
      emailEmployee: registrationCreateDto.contact_email,
      country: registrationCreateDto.nationality,
      phone: registrationCreateDto.contact_number,
      employmentStatus: UserStatus.full_time,
      roles: Role.ADMIN,
      salaryCurrency:
        registrationCreateDto.nationality === 'Indonesia' ? 'IDR' : 'HKD',
      isFirstLogin: true,
      photoLink:
        'https://atech-capacitor.s3.ap-southeast-1.amazonaws.com/dev/ce79b692-49e2-4bd7-910e-21a78e401f43%20-%20profile.png',
      password: password,
      salt: salt,
    });
    return await newUser.save();
  }
  // Balance related
  async getUserLeaveBalancesById(id: string) {
    let user;
    try {
      user = await this.userModel.findById(id).exec();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    if (!user) throw new NotFoundException('User not found');

    return {
      AnnualBalance: user.leaveBalance ?? 0,
      CompensationBalance: user.compensationLeaveBalance ?? 0,
    };
  }
}
