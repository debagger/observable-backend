import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadedImage } from './uploadedImage.entity';
import { LessThan, Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { ImageMetadata, ImageMetadataDocument } from './imageMetadata.shema';
import { LeanDocument, Model } from 'mongoose';
import { join } from 'path';
import { unlink } from 'fs/promises';

@Injectable()
export class CronService {
  constructor(
    @InjectRepository(UploadedImage)
    private uploadedImageRepository: Repository<UploadedImage>,
    @InjectModel(ImageMetadata.name)
    private ImageMetadataModel: Model<ImageMetadataDocument>,
    private readonly logger: PinoLogger,
  ) {
    logger.setContext(CronService.name);
  }

  @Cron('45 * * * * *')
  async handleCron() {
    const minutesAgo = new Date(Date.now() - 60000 * 10);
    const unasccesedImages = await this.uploadedImageRepository.find({
      where: { lastAccessDate: null, date: LessThan(minutesAgo) },
    });

    this.logger.debug(
      `Found ${unasccesedImages.length} unaccessed images more then 10 minutes old`,
    );
    for (const item of unasccesedImages) {
      await this.deleteImage(item);
      this.logger.debug(`Image id = ${item.id} deleted`);
    }
    const tenMinlastaccImages = await this.uploadedImageRepository.find({
      where: { lastAccessDate: LessThan(minutesAgo) },
    });
    this.logger.debug(
      `Found ${unasccesedImages.length} images with more then 10 minutes last access`,
    );

    for (const item of tenMinlastaccImages) {
      await this.deleteImage(item);
      this.logger.debug(`Image id = ${item.id} deleted`);
    }
  }

  private async deleteImage(data: UploadedImage) {
    await this.uploadedImageRepository.delete({ id: data.id });
    await this.ImageMetadataModel.findOneAndDelete({ id: data.id });
    const path = join('/images', data.filename);
    await unlink(path);
  }
}