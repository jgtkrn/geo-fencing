import { UserRepository } from 'src/users/repository/user.repository';
import { Request } from 'express';
import { User } from './../schemas/user.schema';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserCreateDto } from '../dto/userCreate.dto';
import { UserUpdateDto } from '../dto/userUpdate.dto';
import { UserEditProfileDto } from '../dto/userEditProfile.dto';
import { UserCreateSsoDto } from '../dto/userCreateSso.dto';
import { UserSearchCompany } from '../dto/userSearchCompany.dto';
import { UserIsPlayingIdDto } from '../dto/userIsPlaying.dto';
import { PaginationDto } from '../../helper/pagination/dto/pagination.dto';
import { IsIdleDto } from 'src/auth/dto/isIdle.dto';
import { JwtDataInterface } from 'src/types/jwt';
import { ResponseApi } from 'src/types/response';
import { JwtHelperService } from 'src/utils/helper/jwt/jwt.service';
import { UserOffboarding } from '../dto/userOffboarding.dto';
import { UserLinkingDto } from '../dto/userLinking.dto';
import { UserUnlinkingDto } from '../dto/userUnlinking.dto';
import { RegistrationCreateDto } from 'src/subscription/dto/registrationCreate.dto';
import { CompanyService } from 'src/company/services/company.service';
import { SubscriptionService } from 'src/subscription/services/subscription.service';

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    private jwtHelperService: JwtHelperService,
    private companyService: CompanyService,
    private subscriptionService: SubscriptionService,
  ) {}

  async createUser(userCreateDto: UserCreateDto): Promise<User> {
    return await this.userRepository.createUser(userCreateDto);
  }

  async createUserSso(payload: UserCreateSsoDto): Promise<User> {
    return await this.userRepository.creatOrLoginUser(payload);
  }

  async updateUser(
    id: string,
    userUpdateDto: UserUpdateDto,
    file: Express.Multer.File,
    request: Request,
  ): Promise<User> {
    const token = request.cookies.jwt || request.headers.authorization;
    const decodedToken = await this.jwtHelperService.decodedToken(token);
    return await this.userRepository.updateUser(
      id,
      userUpdateDto,
      file,
      decodedToken,
    );
  }

  async deleteUser(id: string): Promise<User> {
    return await this.userRepository.deleteUser(id);
  }

  async findAll(companyId: string): Promise<User[]> {
    return await this.userRepository.findAll(companyId);
  }

  async findListUsersWithoutRbac(
    request: Request,
    query?: UserOffboarding,
  ): Promise<ResponseApi> {
    let terminationStatus = query.terminationStatus;
    let dataToken: any;
    if (request.cookies.jwt)
      dataToken = this.jwtHelperService.decodedToken(request.cookies.jwt);
    else
      dataToken = this.jwtHelperService.decodedToken(
        request.headers['authorization'],
      );

    return await this.userRepository.findAllTest(
      dataToken.company,
      terminationStatus,
    );
    // return await this.userRepository.findAll(dataToken.company, terminationStatus)
  }

  async findSimpleListUser(request: Request): Promise<ResponseApi> {
    const token: string =
      request.cookies.jwt || request.headers['authorization'];
    const dataToken = this.jwtHelperService.decodedToken(token);
    return await this.userRepository.findSimpleListUser(dataToken);
  }

  async updateLinkingUser(
    request: Request,
    data: UserLinkingDto,
  ): Promise<ResponseApi> {
    let dataToken: any;
    if (request.cookies.jwt)
      dataToken = this.jwtHelperService.decodedToken(request.cookies.jwt);
    else
      dataToken = this.jwtHelperService.decodedToken(
        request.headers['authorization'],
      );

    return await this.userRepository.updateLinkingUser(dataToken, data);
  }

  async updateUnlinkingUser(
    request: Request,
    data: UserUnlinkingDto,
  ): Promise<ResponseApi> {
    let dataToken: any;
    if (request.cookies.jwt)
      dataToken = this.jwtHelperService.decodedToken(request.cookies.jwt);
    else
      dataToken = this.jwtHelperService.decodedToken(
        request.headers['authorization'],
      );

    return await this.userRepository.updateUnlinkingUser(dataToken, data);
  }

  async findAllUsers(
    request: Request,
    query: PaginationDto,
    param: UserSearchCompany,
  ): Promise<User[]> {
    if (request.cookies.jwt) {
      const decodedToken = request.cookies.jwt.split('.')[1];
      const payloadBuffer = Buffer.from(decodedToken, 'base64');
      const updatedToken = JSON.parse(payloadBuffer.toString());
      if (['admin', 'hr'].includes(updatedToken.roles)) {
        return await this.userRepository.findAllCompanyId(
          updatedToken.company,
          query,
          param,
        );
      } else {
        throw new UnauthorizedException('Please Check Your Role');
      }
    } else {
      const decodedToken = request.headers['authorization'].split('.')[1];
      const payloadBuffer = Buffer.from(decodedToken, 'base64');
      const updatedToken = JSON.parse(payloadBuffer.toString());
      if (['admin', 'hr'].includes(updatedToken.roles)) {
        return await this.userRepository.findAllCompanyId(
          updatedToken.company,
          query,
          param,
        );
      } else {
        throw new UnauthorizedException('Please Check Your Role');
      }
    }
  }

  async findAllWithCompany(): Promise<User[]> {
    return await this.userRepository.findAllWithCompany();
  }

  async validateUser(email: string, password: string): Promise<User> {
    return await this.userRepository.validateUser(email, password);
  }

  async getUserById(id: string): Promise<any> {
    return await this.userRepository.findOne(id);
  }

  async getUserByCredentials(id: string): Promise<User | object> {
    return await this.userRepository.getUserByCredentials(id);
  }

  async updateLogin(id: string): Promise<User> {
    return await this.userRepository.updateLogin(id);
  }

  async updateLastActive(
    id: string,
    lastProjectId: string,
    lastTaskId: string,
    isLogout: string,
    lastLoginAt: any,
  ): Promise<User> {
    return await this.userRepository.updateLastActive(
      id,
      lastProjectId,
      lastTaskId,
      isLogout,
      lastLoginAt,
    );
  }

  async getOnline(
    sort_dir: string,
    project: string,
    company: string,
  ): Promise<User> {
    return await this.userRepository.getOnline(sort_dir, project, company);
  }

  async getApproverExpense(
    managerId: string,
    companyId: string,
  ): Promise<User | any> {
    return await this.userRepository.getApproverExpense(managerId, companyId);
  }

  async getOneHrUser(companyId: string): Promise<User> {
    return await this.userRepository.getOneHrUser(companyId);
  }

  async getHrUser(companyId: string): Promise<Array<User> | any> {
    return await this.userRepository.getHrUser(companyId);
  }

  async checkIsManager(userId: string): Promise<User> {
    return await this.userRepository.checkIsManager(userId);
  }

  async findByEmail(email: string) {
    return await this.userRepository.findByEmail(email);
  }

  async editProfile(
    id: string,
    data: UserEditProfileDto,
    file: Express.Multer.File,
  ): Promise<User> {
    return await this.userRepository.editProfile(id, data, file);
  }

  async updatePlaying(id: string, isPlaying: boolean): Promise<object | any> {
    return await this.userRepository.updatePlaying(id, isPlaying);
  }

  async updatePlayingId(
    userUpdatePlayingId: UserIsPlayingIdDto,
  ): Promise<object | any> {
    return await this.userRepository.updateIsPlayingId(userUpdatePlayingId);
  }

  async updateIsPlayingFalse(): Promise<void> {
    return await this.userRepository.updateIsPlayingFalse();
  }

  async updateEmployeeStatusOffBoarding(
    userId: string,
  ): Promise<Object | boolean> {
    return await this.userRepository.updateEmployeeStatusOffBoarding(userId);
  }

  async updateIsIdle(
    dataToken: JwtDataInterface,
    isIdleDto: IsIdleDto,
  ): Promise<ResponseApi> {
    return await this.userRepository.updateIsIdle(dataToken, isIdleDto);
  }

  async setUserOffline(id: string, offline: boolean = false) {
    return await this.userRepository.setUserOffline(id, offline);
  }

  async createUserSubscription(
    registrationCreateDto: RegistrationCreateDto,
    randomPassword: string,
  ): Promise<User> {
    return await this.userRepository.createUserSubscription(
      registrationCreateDto,
      randomPassword,
    );
  }

  async checkCompanySubscription(companyId: string): Promise<any> {
    const subsData = await this.subscriptionService.checkSubscriptionStatus(
      companyId,
    );
    // CAPW-1071 still hardcode for subsData because we don't have the subscription yet on production for some company
    return subsData?.subscription_plan ?? 'free';
  }

  async getUserLeaveBalancesById(id) {
    return this.userRepository.getUserLeaveBalancesById(id);
  }
}
