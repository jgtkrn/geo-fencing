import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

import { v4 as uuid } from 'uuid';

@Injectable()
export class FileuploadService {
  AWS_S3_BUCKET = process.env.AWS_BUCKET;
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET,
  });

  async uploadFileExpanse(files: Array<Express.Multer.File>): Promise<object> {
    const location = [];
    for (const file of files) {
      const data = await this.s3Upload(
        file.buffer,
        `dev/${uuid()} - ${String(file.originalname)}`,
        file.mimetype,
        false,
      );

      location.push({
        location: data.Location,
        sizeFile: file.size,
        detailFile: file.originalname,
      });
    }
    return location;
  }

  async uploadProfileImage(file: Express.Multer.File): Promise<any> {
    const data = await this.s3Upload(
      file.buffer,
      `dev/${uuid()} - ${String(file.originalname)}`,
      file.mimetype,
      true,
    );
    return data;
  }

  async uploadOneImage(file: Express.Multer.File): Promise<any> {
    const data = await this.s3Upload(
      file.buffer,
      `dev/${uuid()} - ${String(file.originalname)}`,
      file.mimetype,
      true,
    );
    return data;
  }

  async uploadOneFile(file: Express.Multer.File): Promise<any> {
    const data = await this.s3Upload(
      file.buffer,
      `dev/${uuid()} - ${String(file.originalname)}`,
      file.mimetype,
      false,
    );
    return data;
  }

  async removeOneFile(fileLink: string): Promise<any> {
    const fileUrlArray = fileLink.split('/');
    const filePath = fileUrlArray.slice(-2).join('/');
    const decodedFilePath = decodeURIComponent(filePath);

    const params = {
      Bucket: this.AWS_S3_BUCKET,
      Key: decodedFilePath,
    };
    const result = await this.s3.deleteObject(params).promise();
    return result;
  }

  async s3Upload(
    file: Buffer,
    key: string,
    mimetype: string,
    isImage: boolean,
  ) {
    if (isImage === false) {
      const params = {
        Bucket: this.AWS_S3_BUCKET,
        Key: key,
        Body: file,
        ContentType: mimetype,
        ContentDisposition: 'attachment',
      };
      try {
        const s3Response = await this.s3.upload(params).promise();
        return s3Response;
      } catch (e) {
        console.log(e);
      }
    } else {
      const params = {
        Bucket: this.AWS_S3_BUCKET,
        Key: key,
        Body: file,
        ContentType: mimetype,
        ContentDisposition: 'inline',
      };
      try {
        const s3Response = await this.s3.upload(params).promise();
        return s3Response;
      } catch (e) {
        console.log(e);
      }
    }
  }

  async removeOneFileExpense(fileLink: string): Promise<any> {
    const fileUrlArray = fileLink.split('/');
    const filePath = fileUrlArray.slice(-2).join('/');
    const decodedFilePath = decodeURIComponent(filePath);

    const params = {
      Bucket: this.AWS_S3_BUCKET,
      Key: decodedFilePath,
    };
    const result = await this.s3.deleteObject(params).promise();
    return result;
  }
}
