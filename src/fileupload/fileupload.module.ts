import { Module } from '@nestjs/common';
import { FileuploadService } from './services/fileupload.service';

@Module({
  exports: [FileuploadService],
  providers: [FileuploadService],
})
export class FileuploadModule {}
