import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GeoFencingController } from './controller/geofencing.controller';
import { GeoFencingService } from './services/geofencing.service';
import { GeoFencingRepository } from './repository/geofencing.repository';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { GeoFencing, GeoFencingSchema } from './schema/geofencing.schema';
import { Location, LocationSchema } from 'src/location/schema/location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeoFencing.name, schema: GeoFencingSchema },
      { name: User.name, schema: UserSchema },
      { name: Location.name, schema: LocationSchema }
    ]),
  ],
  controllers: [GeoFencingController],
  providers: [GeoFencingService, GeoFencingRepository],
  exports: [GeoFencingService]
})
export class GeoFencingModule {}
