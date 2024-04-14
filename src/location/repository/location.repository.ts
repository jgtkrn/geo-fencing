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
import { LocationCreateDto } from '../dto/locationCreate.dto';
import { LocationUpdateDto } from '../dto/locationUpdate.dto';
import { Location } from '../schema/location.schema';

@Injectable()
export class LocationRepository {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<Location>,
  ) {}

  /*
   * [====================METHOD FOR UPDATE,CREATE, DELETE DATA=============================]
   */

  // * CREATE Location

  async createLocation(locationCreateDto: LocationCreateDto): Promise<object> {
    let newLocation = new this.locationModel(locationCreateDto);
    let response: object;
    try {
      newLocation = await newLocation.save();
      if (newLocation) {
        response = {
          status: true,
          data: newLocation,
          statusCode: 201,
          message: 'Location Created',
        };
      }
      return response;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  //  Update Location Based Location Id

  async updateLocation(
    id: string,
    locationUpdateDto: LocationUpdateDto,
  ): Promise<object> {
    const objId = mongoose.Types.ObjectId;
    let response: any;
    try {
      if (objId.isValid(id)) {
        const location = await this.locationModel
          .findOneAndUpdate({ _id: id }, locationUpdateDto)
          .setOptions({ overwrite: true, new: true });

        if (location) {
          response = {
            status: true,
            data: location,
            statusCode: 201,
            message: 'Location Updated',
          };
        } else {
          throw new NotFoundException(`Location with id ${id} not found`);
        }
      } else {
        throw new BadRequestException(`invalid object id ${id}`);
      }
      return response;
    } catch (error) {
      throw new BadRequestException(`invalid object id ${id}`);
    }
  }

  //   Delete Location Based Id
  async deleteLocationId(id: string): Promise<any> {
    const objectId = mongoose.Types.ObjectId;
    if (objectId.isValid(id)) {
      const deleted = await this.locationModel.findByIdAndRemove(id);
      if (deleted) {
        throw new HttpException('Location Deleted', HttpStatus.OK);
      }
    }
  }

  //   Delete Location Based User Id

  async deleteLocationUser(id: string): Promise<any> {
    const objectId = mongoose.Types.ObjectId;
    if (objectId.isValid(id)) {
      const deleted = await this.locationModel.deleteMany({ userId: id });
      if (deleted) {
        throw new HttpException('All Location Deleted', HttpStatus.OK);
      }
    }
  }

  /*
   * [====================LIST METHOD FOR GET DATA=============================]
   */

  // * Get all location data

  async findAll(): Promise<Location[]> {
    const location = await this.locationModel
      .find()
      .populate('userId', ['_id', 'name', 'email'], User.name)
      .exec();
    let response: any;
    if (location) {
      response = {
        status: true,
        data: location,
        statusCode: 200,
        message: 'Get Location',
      };
    } else {
      throw new NotFoundException();
    }
    return response;
  }

  async findOne(id: string): Promise<Location> {
    let response: any;
    let location: Location;
    try {
      location = await this.locationModel
        .findById(id)
        .populate('userId', ['_id', 'name', 'email'], User.name)
        .exec();
    } catch (error) {
      throw new BadRequestException(`invalid objectId ${id}`);
    }

    if (!location) {
      throw new NotFoundException(
        `The location with this id ${id} does not exist`,
      );
    } else {
      response = {
        status: true,
        data: location,
        statusCode: 200,
        message: 'Get Location',
      };
    }
    return response;
  }

  async findByUserId(id: string): Promise<Location[]> {
    let response: any;
    let location: Location[];
    try {
      location = await this.locationModel
        .find({ userId: id })
        .populate('userId', ['_id', 'name', 'email'], User.name)
        .exec();
    } catch (error) {
      throw new BadRequestException(`invalid objectId ${id}`);
    }

    if (!location) {
      throw new NotFoundException(
        `The location with this user id ${id} does not exist`,
      );
    } else {
      response = {
        status: true,
        data: location,
        statusCode: 200,
        message: 'Get Location Based User Id',
      };
    }
    return response;
  }
}
