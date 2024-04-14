import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Param,
  Delete,
  NotFoundException,
  Version,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwtAuth.guard';
import { Role } from 'src/users/schemas/user-role';
import { LocationCreateDto } from '../dto/locationCreate.dto';
import { LocationUpdateDto } from '../dto/locationUpdate.dto';
import { Location } from '../schema/location.schema';
import { LocationService } from '../services/location.service';

@ApiBearerAuth('access_token')
@Controller({ path: 'location' })
export class LocationController {
  constructor(private locationService: LocationService) {}

  @ApiTags('location-mobile')
  @Version('1')
  @ApiCreatedResponse({ type: Location, description: 'Create Location' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Post()
  async createLocation(
    @Body() locationCreateDto: LocationCreateDto,
  ): Promise<object> {
    return await this.locationService.createLocation(locationCreateDto);
  }

  @ApiTags('location-web')
  @Version('2')
  @ApiCreatedResponse({ type: Location, description: 'Create Location' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Post()
  async createLocationWeb(
    @Body() locationCreateDto: LocationCreateDto,
  ): Promise<object> {
    return await this.locationService.createLocation(locationCreateDto);
  }

  @ApiTags('location-mobile')
  @Version('1')
  @ApiOkResponse({ type: Location, description: 'Get Location' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get()
  async findAllLocation(): Promise<Location[]> {
    return await this.locationService.findAll();
  }

  @ApiTags('location-web')
  @Version('2')
  @ApiOkResponse({ type: Location, description: 'Get Location' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAllLocationWeb(): Promise<Location[]> {
    return await this.locationService.findAll();
  }

  @ApiTags('location-mobile')
  @Version('1')
  @ApiCreatedResponse({ type: Location, description: 'Update Location' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Put('/:id')
  async updateLocation(
    @Param('id') id: string,
    @Body() payload: LocationUpdateDto,
  ): Promise<object> {
    return await this.locationService.updateLocation(id, payload);
  }

  @ApiTags('location-web')
  @Version('2')
  @ApiCreatedResponse({ type: Location, description: 'Update Location' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  async updateLocationWeb(
    @Param('id') id: string,
    @Body() payload: LocationUpdateDto,
  ): Promise<object> {
    return await this.locationService.updateLocation(id, payload);
  }

  @ApiTags('location-mobile')
  @Version('1')
  @ApiOkResponse({ type: Location, description: 'Delete Location' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Delete('/:id')
  async removeLocation(@Param('id') id: string): Promise<any> {
    const result = await this.locationService.deleteLocationId(id);
    if (!result) {
      throw new NotFoundException('Location not found');
    }
  }

  @ApiTags('location-web')
  @Version('2')
  @ApiOkResponse({ type: Location, description: 'Delete Location' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async removeLocationWeb(@Param('id') id: string): Promise<any> {
    const result = await this.locationService.deleteLocationId(id);
    if (!result) {
      throw new NotFoundException('Location not found');
    }
  }

  @ApiTags('location-mobile')
  @Version('1')
  @ApiOkResponse({
    type: Location,
    description: 'Delete Location Based User Id',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Delete('/user/:id')
  async removeLocationBasedUser(@Param('id') id: string): Promise<any> {
    const result = await this.locationService.deleteLocationUser(id);
    if (!result) {
      throw new NotFoundException('Location not found');
    }
  }

  @ApiTags('location-web')
  @Version('2')
  @ApiOkResponse({
    type: Location,
    description: 'Delete Location Based User Id',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Delete('/user/:id')
  async removeLocationBasedUserWeb(@Param('id') id: string): Promise<any> {
    const result = await this.locationService.deleteLocationUser(id);
    if (!result) {
      throw new NotFoundException('Location not found');
    }
  }

  @ApiTags('location-mobile')
  @Version('1')
  @ApiOkResponse({ type: Location, description: 'Get Single Location' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get('/:id')
  async findOneLocation(@Param('id') id: string): Promise<Location> {
    return await this.locationService.findLocationById(id);
  }

  @ApiTags('location-web')
  @Version('2')
  @ApiOkResponse({ type: Location, description: 'Get Single Location' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async findOneLocationWeb(@Param('id') id: string): Promise<Location> {
    return await this.locationService.findLocationById(id);
  }

  @ApiTags('location-mobile')
  @Version('1')
  @ApiOkResponse({ type: Location, description: 'Get Location Based User' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get('/user/:id')
  async findOneLocationBasedUser(@Param('id') id: string): Promise<Location[]> {
    return await this.locationService.findLocationByUser(id);
  }

  @ApiTags('location-web')
  @Version('2')
  @ApiOkResponse({ type: Location, description: 'Get Location Based User' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('/user/:id')
  async findOneLocationBasedUserWeb(
    @Param('id') id: string,
  ): Promise<Location[]> {
    return await this.locationService.findLocationByUser(id);
  }
}
