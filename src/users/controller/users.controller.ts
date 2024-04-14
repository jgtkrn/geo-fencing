import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Version,
  Query,
  Req,
} from '@nestjs/common';
import { UserCreateDto } from '../dto/userCreate.dto';
import { UserUpdateDto } from '../dto/userUpdate.dto';
import { User } from '../schemas/user.schema';
import { UsersService } from '../services/users.service';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Role } from '../schemas/user-role';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserEditProfileDto } from '../dto/userEditProfile.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwtAuth.guard';
import { UserCreateSsoDto } from '../dto/userCreateSso.dto';
import { UserSearchCompany } from '../dto/userSearchCompany.dto';
import { PaginationDto } from '../../helper/pagination/dto/pagination.dto';
import { Request } from 'express';
import { ResponseApi } from 'src/types/response';
import { UserOffboarding } from '../dto/userOffboarding.dto';
import { UserLinkingDto } from '../dto/userLinking.dto';
import { UserUnlinkingDto } from '../dto/userUnlinking.dto';

@ApiBearerAuth('access_token')
@Controller({ path: 'users' })
export class UsersController {
  constructor(private userService: UsersService) {}

  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({ type: User, description: 'Get user' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get()
  getAllUser(
    @Query() param: UserSearchCompany,
    @Query() query: PaginationDto,
    @Req() request: Request,
  ): Promise<User[]> {
    return this.userService.findAllUsers(request, query, param);
  }

  @ApiTags('users-web')
  @Version('2')
  @ApiOkResponse({ type: User, description: 'Get user' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get()
  getAllUserWeb(
    @Query() param: UserSearchCompany,
    @Query() query: PaginationDto,
    @Req() request: Request,
  ): Promise<User[]> {
    return this.userService.findAllUsers(request, query, param);
  }

  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({
    type: User,
    description: 'Get list user without pagination and RBAC',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get('/list-without-rbac')
  getAllUserWithoutRbac(@Req() request: Request): Promise<ResponseApi> {
    return this.userService.findListUsersWithoutRbac(request);
  }

  @ApiTags('users-web')
  @Version('2')
  @ApiOkResponse({
    type: User,
    description: 'Get list user without pagination and RBAC',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('/list-without-rbac')
  getAllUserWithoutRbacWeb(
    @Req() request: Request,
    @Query() query: UserOffboarding,
  ): Promise<ResponseApi> {
    return this.userService.findListUsersWithoutRbac(request, query);
  }

  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({ type: User, description: `Get list user for subscription` })
  @ApiUnauthorizedResponse({ description: `Unauthorized` })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get('/simple-list-user')
  findSimpleListUser(@Req() request: Request): Promise<ResponseApi> {
    return this.userService.findSimpleListUser(request);
  }

  @ApiTags('users-web')
  @Version('2')
  @ApiOkResponse({ type: User, description: 'Get list user for subscription' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('/simple-list-user')
  findSimpleListUserWeb(@Req() request: Request): Promise<ResponseApi> {
    return this.userService.findSimpleListUser(request);
  }

  @ApiTags('users-web')
  @Version('2')
  @ApiOkResponse({ type: User, description: 'Get user' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('/search-users')
  getAllUserWebCompany(
    @Query() param: UserSearchCompany,
    @Query() query: PaginationDto,
    @Req() request: Request,
  ): Promise<User[]> {
    return this.userService.findAllUsers(request, query, param);
  }

  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({ type: User, description: 'Get user with companies' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get('/companies')
  getAllUserWithCompany(): Promise<User[]> {
    return this.userService.findAllWithCompany();
  }

  @ApiTags('users-web')
  @Version('2')
  @ApiOkResponse({ type: User, description: 'Get user with companies' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('/companies')
  getAllUserWithCompanyWeb(): Promise<User[]> {
    return this.userService.findAllWithCompany();
  }

  // ? TODO Create Spesific Search API (Query param) For USers/Employee
  // @Get('/spesific')
  // getAllUserSpesific(
  //   @Query() userSpesificDto: UserSpesificDto,
  // ): Promise<User[]> {
  //   return this.userService.findAllUserSpesific(userSpesificDto);
  // } => Still development

  @ApiTags('users-mobile')
  @Version('1')
  @ApiCreatedResponse({ type: User, description: 'User/Employee Created' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Post()
  async createUser(@Body() userCreateDto: UserCreateDto): Promise<User> {
    return this.userService.createUser(userCreateDto);
  }

  @ApiTags('users-web')
  @Version('2')
  @ApiCreatedResponse({ type: User, description: 'User/Employee Created' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  // @UseGuards(JwtAuthGuard)
  @Post()
  async createUserWeb(@Body() userCreateDto: UserCreateDto): Promise<User> {
    return this.userService.createUser(userCreateDto);
  }

  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({ type: User, description: 'Get user' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get('/:id')
  async findOneUser(@Param('id') id: string): Promise<any> {
    return await this.userService.getUserById(id);
  }

  @ApiTags('users-web')
  @Version('2')
  @ApiOkResponse({ type: User, description: 'Get user' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async findOneUserWeb(@Param('id') id: string): Promise<User> {
    return await this.userService.getUserById(id);
  }

  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({ type: User, description: 'User Updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Put('/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateUser(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @Body() data: UserUpdateDto,
    @Req() request: Request,
  ): Promise<User> {
    return this.userService.updateUser(id, data, file, request);
  }

  @ApiTags('users-web')
  @Version('2')
  @ApiOkResponse({ type: User, description: 'User Updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateUserWeb(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @Body() data: UserUpdateDto,
    @Req() request: Request,
  ): Promise<User> {
    return this.userService.updateUser(id, data, file, request);
  }

  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({ type: User, description: 'User Updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Put('edit-profile/:id')
  @UseInterceptors(FileInterceptor('file'))
  async editProfile(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @Body() data: UserEditProfileDto,
  ): Promise<any> {
    return await this.userService.editProfile(id, data, file);
  }

  @ApiTags('users-web')
  @Version('2')
  @ApiOkResponse({ type: User, description: 'User Updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Put('edit-profile/:id')
  @UseInterceptors(FileInterceptor('file'))
  async editProfileWeb(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @Body() data: UserEditProfileDto,
  ): Promise<any> {
    return await this.userService.editProfile(id, data, file);
  }

  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({ type: User, description: 'User Linking Updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Post('/update-linking-user')
  async updateLinkingUser(
    @Req() request: Request,
    @Body() data: UserLinkingDto,
  ): Promise<ResponseApi> {
    return await this.userService.updateLinkingUser(request, data);
  }

  @ApiTags('users-web')
  @Version('2')
  @ApiOkResponse({ type: User, description: 'User Linking Updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('/update-linking-user')
  async updateLinkingUserWeb(
    @Req() request: Request,
    @Body() data: UserLinkingDto,
  ): Promise<ResponseApi> {
    return await this.userService.updateLinkingUser(request, data);
  }

  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({ type: User, description: 'User Unlinking Updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Post('/update-unlinking-user')
  async updateUnlinkingUser(
    @Req() request: Request,
    @Body() data: UserUnlinkingDto,
  ): Promise<ResponseApi> {
    return await this.userService.updateUnlinkingUser(request, data);
  }

  @ApiTags('users-web')
  @Version('2')
  @ApiOkResponse({ type: User, description: 'User Unlinking Updated' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('/update-unlinking-user')
  async updateUnlinkingUserWeb(
    @Req() request: Request,
    @Body() data: UserUnlinkingDto,
  ): Promise<ResponseApi> {
    return await this.userService.updateUnlinkingUser(request, data);
  }

  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({ description: 'User Deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Delete('/:id')
  async deleteUser(@Param('id') id: string): Promise<User> {
    const result = await this.userService.deleteUser(id);
    if (!result) {
      throw new NotFoundException('User not found');
    }
    return result;
  }

  @ApiTags('users-web')
  @Version('2')
  @ApiOkResponse({ description: 'User Deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async deleteUserWeb(@Param('id') id: string): Promise<User> {
    const result = await this.userService.deleteUser(id);
    if (!result) {
      throw new NotFoundException('User not found');
    }
    return result;
  }

  // Balance related
  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({ description: "Get user's annual leave balance" })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get('/annual-leave/:id')
  async getAnnualLeaveForId(@Param('id') id: string) {
    const balances = await this.userService.getUserLeaveBalancesById(id);
    return {
      status: true,
      statusCode: 200,
      message: 'Success get annual leave.',
      data: {
        id,
        AnnualBalance: balances?.AnnualBalance ?? 0,
      },
    };
  }

  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({ description: "Get user's compensation leave balance" })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get('/compensation-leave/:id')
  async getCompensationLeaveForId(@Param('id') id: string) {
    const balances = await this.userService.getUserLeaveBalancesById(id);
    return {
      status: true,
      statusCode: 200,
      message: 'Success get compensation leave.',
      data: {
        id,
        CompensationBalance: balances?.CompensationBalance ?? 0,
      },
    };
  }

  @ApiTags('users-mobile')
  @Version('1')
  @ApiOkResponse({ description: "Get user's leave balances" })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get('/leave-balances/:id')
  async getLeaveBalances(@Param('id') id: string) {
    const balances = await this.userService.getUserLeaveBalancesById(id);
    return {
      status: true,
      statusCode: 200,
      message: 'Success get leave balances.',
      data: {
        id,
        ...balances,
      },
    };
  }
}
