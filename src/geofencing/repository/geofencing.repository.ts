import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';
import { Location } from 'src/location/schema/location.schema';
import { GeoFencingCreateDto } from '../dto/geofencingCreate.dto';
import { GeoFencingUpdateDto } from '../dto/geofencingUpdate.dto';
import { GeoFencing } from '../schema/geofencing.schema';

@Injectable()
export class GeoFencingRepository {
  constructor(
    @InjectModel(GeoFencing.name) private geoFencingModel: Model<GeoFencing>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Location.name) private locationModel: Model <Location>
  ) {}

  /*
   * [====================METHOD FOR UPDATE,CREATE, DELETE DATA=============================]
   */

  // * Group Users Whom in Radius Area
  async groupUsersInRadius(latitude: any, longitude: any, radius: any): Promise<any[]> {
    let users: any[];

    let lat_range_min: any = Number(latitude) - Number(radius);
    let lat_range_max: any = Number(latitude) + Number(radius);
    let long_range_min: any = Number(longitude) - Number(radius);
    let long_range_max: any = Number(longitude) + Number(radius);

    // find all users where in block of latitude and longitude
    try {
        const users_in_block = await this.userModel.aggregate([    
          {
            $lookup: {
              from: "locations",
              let: { userId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$userId", "$$userId"] }],
                    },
                  },
                },
                {
                  $sort: { updatedAt: -1 },
                },
                {
                  $limit: 1,
                },
              ],
              as: "location",
            },
          },
          {
            $project: {
              _id: 0,
              userName: "$name",
              userId: { $arrayElemAt: ["$location.userId", 0] },
              latitude: { $arrayElemAt: ["$location.latitude", 0] },
              longitude: { $arrayElemAt: ["$location.longitude", 0] },
              createdAt: { $arrayElemAt: ["$location.createdAt", 0] },
              updatedAt: { $arrayElemAt: ["$location.updatedAt", 0] },
            },
          }
        ]);

      let geo_c = radius;

      // set user function to find c for phytagoras
      let findUsersC = (user_latitude, user_longitude) => {
        let geo_lat = Number(latitude);
        let geo_long = Number(longitude);

        let users_a = geo_lat - Number(user_latitude);
        let users_b = geo_long - Number(user_longitude);
        let users_c = Math.sqrt(Math.pow(users_a, 2) + Math.pow(users_b, 2));

        return users_c;
      };

      let user_c;

      // loop filter user by area
      let users_in_radius: any[] = [];
      for (let i = 0; i < users_in_block.length; i++){
        user_c = findUsersC(users_in_block[i].latitude, users_in_block[i].longitude);
        if(user_c <= geo_c && !users_in_radius.some(point => point.userName == users_in_block[i].userName)) 
        {
          users_in_radius.push(users_in_block[i]);
        };
      };

      return users_in_radius;
    } catch (error) {
      return [{Error: error}]
    }

  }

  // * CREATE Geo Fence

  async createGeoFencing(geoFencingCreateDto: GeoFencingCreateDto): Promise<object> {
    let newGeoFencing = new this.geoFencingModel(geoFencingCreateDto);
    let response: object;
    try {
      newGeoFencing = await newGeoFencing.save();
      const in_location = await this.groupUsersInRadius(
        geoFencingCreateDto.latitude, 
        geoFencingCreateDto.longitude,
        geoFencingCreateDto.radius
      );

      if (newGeoFencing) {
        response = {
          status: true,
          data: { geofence: newGeoFencing, in_location },
          statusCode: 201,
          message: 'Geo Fence Created',
        };
      }
      return response;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  //  Update Geo Fence by Id

  async updateGeoFencing(
    id: string,
    geoFencingUpdateDto: GeoFencingUpdateDto,
  ): Promise<object> {
    const objId = mongoose.Types.ObjectId;
    let response: any;
    try {
      if (objId.isValid(id)) {
        const geofence = await this.geoFencingModel
          .findOneAndUpdate({ _id: id }, geoFencingUpdateDto)
          .setOptions({ overwrite: true, new: true });

        if (geofence) {
          const in_location = await this.groupUsersInRadius(
            geofence.latitude, 
            geofence.longitude,
            geofence.radius
          );

          response = {
            status: true,
            data: { geofence, in_location },
            statusCode: 201,
            message: 'Location Updated',
          };
        } else {
          throw new NotFoundException(`geofence with id ${id} not found`);
        }
      } else {
        throw new BadRequestException(`invalid object id ${id}`);
      }
      return response;
    } catch (error) {
      throw new BadRequestException(`invalid object id ${id}`);
    }
  }

  //   Delete Geo Fence By Id
  async deleteGeoFencingId(id: string): Promise<any> {
    const objectId = mongoose.Types.ObjectId;
    if (objectId.isValid(id)) {
      const deleted = await this.geoFencingModel.findByIdAndRemove(id);
      if (deleted) {
        throw new HttpException('geofence Deleted', HttpStatus.OK);
      }
    }
  }


  // /*
  //  * [====================LIST METHOD FOR GET DATA=============================]
  //  */

  // * Get all location data

  async findAll(): Promise<GeoFencing[]> {
    const geofence = await this.geoFencingModel
      .find()
      .sort({'updatedAt': -1})
      .populate('userId', ['_id', 'name', 'email'], User.name)
      .exec();

    let response: any;
    if (geofence) {
      
      let geo_obj: any;
      let in_loc_obj: any;
      let all_geofence: any[] = [];
      for (let i =0; i < geofence.length; i++){
        in_loc_obj = await this.groupUsersInRadius(
          geofence[i].latitude, 
          geofence[i].longitude,
          geofence[i].radius
        );
        geo_obj = { geofence: geofence[i], in_location: in_loc_obj};
        all_geofence.push(geo_obj);
      };

      response = {
        status: true,
        data: all_geofence,
        statusCode: 200,
        message: 'Get Geo Fences',
      };
    } else {
      throw new NotFoundException();
    }
    return response;
  }

  async findOne(id: string): Promise<GeoFencing> {
    let response: any;
    let geofencing: GeoFencing;
    try {
      geofencing = await this.geoFencingModel
        .findById(id)
        .populate('userId', ['_id', 'name', 'email'], User.name)
        .exec();
    } catch (error) {
      throw new BadRequestException(`invalid objectId ${id}`);
    }

    if (!geofencing) {
      throw new NotFoundException(
        `The geofencing with this id ${id} does not exist`,
      );
    } else {
      const in_location = await this.groupUsersInRadius(
        geofencing.latitude, 
        geofencing.longitude,
        geofencing.radius
      );
      response = {
        status: true,
        data: { geofence: geofencing, in_location },
        statusCode: 200,
        message: 'Get Geo Fence',
      };
    }
    return response;
  }

}
