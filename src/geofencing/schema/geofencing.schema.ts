import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

@Schema({
  timestamps: true,
})
export class GeoFencing extends Document {
  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  _id: MongooseSchema.Types.ObjectId;

  @ApiProperty()
  @Prop({ required:true })
  location_name: string;

  @ApiProperty()
  @Prop({ required: true })
  latitude: string;

  @ApiProperty()
  @Prop({ required: true })
  longitude: string;

  @ApiProperty()
  @Prop({ required: true })
  radius: string;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: User;

  @ApiProperty({ required: false })
  @Prop()
  createdBy: string;

  @ApiProperty({ required: false })
  @Prop()
  updatedBy: string;

  @ApiProperty({ required: false })
  @Prop()
  isDeleted: string;
}

export const GeoFencingSchema = SchemaFactory.createForClass(GeoFencing);
