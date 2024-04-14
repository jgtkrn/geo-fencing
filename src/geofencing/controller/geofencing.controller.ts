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
import { GeoFencingCreateDto } from '../dto/geofencingCreate.dto';
import { GeoFencingUpdateDto } from '../dto/geofencingUpdate.dto';
import { GeoFencing } from '../schema/geofencing.schema';
import { GeoFencingService } from '../services/geofencing.service';

@ApiBearerAuth('access_token')
@Controller({ path:'geofencing' })
export class GeoFencingController {
  constructor(private geoFencingService: GeoFencingService){}

  @ApiTags('geofencing-mobile')
  @Version('1')
  @ApiCreatedResponse({ type: GeoFencing, description: 'Create GeoFencing' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Post()
  async createGeoFencingMobile(
    @Body() geoFencingCreateDto: GeoFencingCreateDto,
  ): Promise<object> {
    return await this.geoFencingService.createGeoFencing(geoFencingCreateDto);
  }

  @ApiTags('geofencing-web')
  @Version('2')
  @ApiCreatedResponse({ type: GeoFencing, description: 'Create GeoFencing' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Post()
  async createGeoFencingWeb(
    @Body() geoFencingCreateDto: GeoFencingCreateDto,
  ): Promise<object> {
    return await this.geoFencingService.createGeoFencing(geoFencingCreateDto);
  }

  @ApiTags('geofencing-mobile')
  @Version('1')
  @ApiOkResponse({ type: GeoFencing, description: 'Get GeoFencing' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get()
  async findAllGeoFenceMobile(): Promise<GeoFencing[]> {
    return await this.geoFencingService.findAll();
  }

  @ApiTags('geofencing-web')
  @Version('2')
  @ApiOkResponse({ type: GeoFencing, description: 'Get GeoFencing' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAllGeoFenceWeb(): Promise<GeoFencing[]> {
    return await this.geoFencingService.findAll();
  }

  @ApiTags('geofencing-mobile')
  @Version('1')
  @ApiOkResponse({ type: GeoFencing, description: 'Get Single GeoFencing' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Get('/:id')
  async findOneGeoFencingMobile(@Param('id') id: string): Promise<GeoFencing> {
    return await this.geoFencingService.findGeoFencingById(id);
  } 

  @ApiTags('geofencing-web')
  @Version('2')
  @ApiOkResponse({ type: GeoFencing, description: 'Get Single GeoFencing' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async findOneGeoFencingWeb(@Param('id') id: string): Promise<GeoFencing> {
    return await this.geoFencingService.findGeoFencingById(id);
  } 

  @ApiTags('geofencing-mobile')
  @Version('1')
  @ApiCreatedResponse({ type: GeoFencing, description: 'Update GeoFencing' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Put('/:id')
  async updateGeoFenceMobile(
    @Param('id') id: string,
    @Body() payload: GeoFencingUpdateDto,
  ): Promise<object> {
    return await this.geoFencingService.updateGeoFencing(id, payload);
  }

  @ApiTags('geofencing-web')
  @Version('2')
  @ApiCreatedResponse({ type: GeoFencing, description: 'Update GeoFencing' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  async updateGeoFenceWeb(
    @Param('id') id: string,
    @Body() payload: GeoFencingUpdateDto,
  ): Promise<object> {
    return await this.geoFencingService.updateGeoFencing(id, payload);
  }

  @ApiTags('geofencing-mobile')
  @Version('1')
  @ApiOkResponse({
    type: GeoFencing,
    description: 'Delete By Id',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.HR)
  @Delete('/:id')
  async removeGeoFencingMobile(@Param('id') id: string): Promise<any> {
    const result = await this.geoFencingService.deleteGeoFencing(id);
    if (!result) {
      throw new NotFoundException('GeoFencing not found');
    }
  }

  @ApiTags('geofencing-web')
  @Version('2')
  @ApiOkResponse({
    type: GeoFencing,
    description: 'Delete By Id',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async removeGeoFencingWeb(@Param('id') id: string): Promise<any> {
    const result = await this.geoFencingService.deleteGeoFencing(id);
    if (!result) {
      throw new NotFoundException('GeoFencing not found');
    }
  }
}
