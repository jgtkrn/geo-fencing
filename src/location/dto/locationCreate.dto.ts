import { ApiProperty } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Schema as MongooseSchema } from 'mongoose';

export class LocationCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsLatitude()
  latitude: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsLongitude()
  longitude: string;

  @ApiProperty()
  @IsMongoId()
  userId: MongooseSchema.Types.ObjectId;

  @ApiProperty({ required: false })
  @IsOptional()
  createdBy?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  updatedBy?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isDeleted?: string;
}
