import { Injectable } from '@nestjs/common';
import { LocationCreateDto } from '../dto/locationCreate.dto';
import { LocationUpdateDto } from '../dto/locationUpdate.dto';
import { LocationRepository } from '../repository/location.repository';
import { Location } from '../schema/location.schema';

@Injectable()
export class LocationService {
  constructor(private locationRepository: LocationRepository) {}

  async createLocation(locationCreateDto: LocationCreateDto): Promise<object> {
    return await this.locationRepository.createLocation(locationCreateDto);
  }

  async updateLocation(
    id: string,
    locationUpdateDto: LocationUpdateDto,
  ): Promise<object> {
    return await this.locationRepository.updateLocation(id, locationUpdateDto);
  }

  async deleteLocationId(id: string): Promise<any> {
    return await this.locationRepository.deleteLocationId(id);
  }

  async deleteLocationUser(id: string): Promise<any> {
    return await this.locationRepository.deleteLocationUser(id);
  }

  async findAll(): Promise<Location[]> {
    return await this.locationRepository.findAll();
  }

  async findLocationById(id: string): Promise<Location> {
    return await this.locationRepository.findOne(id);
  }

  async findLocationByUser(id: string): Promise<Location[]> {
    return await this.locationRepository.findByUserId(id);
  }
}
