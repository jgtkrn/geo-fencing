import { Injectable } from '@nestjs/common';
import { GeoFencingCreateDto } from '../dto/geofencingCreate.dto';
import { GeoFencingUpdateDto } from '../dto/geofencingUpdate.dto';
import { GeoFencing } from '../schema/geofencing.schema';
import { GeoFencingRepository } from '../repository/geofencing.repository';

@Injectable()
export class GeoFencingService {

	constructor(private geoFencingRepository: GeoFencingRepository){}

	async createGeoFencing(geoFencingCreateDto: GeoFencingCreateDto): Promise<object> {
    	return await this.geoFencingRepository.createGeoFencing(geoFencingCreateDto);
  	}

  	async findAll(): Promise<GeoFencing[]> {
  		return await this.geoFencingRepository.findAll();
  	}

  	async findGeoFencingById(id: string): Promise<GeoFencing> {
  		return await this.geoFencingRepository.findOne(id);
  	}

  	async updateGeoFencing(id: string, geoFencingUpdateDto: GeoFencingUpdateDto): Promise<object> {
  		return await this.geoFencingRepository.updateGeoFencing(id, geoFencingUpdateDto);
  	}

  	async deleteGeoFencing(id: string): Promise<any> {
  		return await this.geoFencingRepository.deleteGeoFencingId(id);
  	}
}
