import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { UploadedImage } from './uploadedImage.entity';
import { LessThan, Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { ImageMetadata, ImageMetadataDocument } from './imageMetadata.shema';
import { Model } from 'mongoose';
import { join } from 'path';
import { unlink, opendir, stat } from 'fs/promises';
import {
  imageDeletedCountCounter,
  imageTotalFileBytesCountGauge,
  imageTotalFilesCountGauge,
} from './prom-metrics';

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
  @Cron('0 * * * * *')
  async collectImageDirCountAndSize() {
    try {
      this.logger.info('Collect metrics for /image dir');
      const dircontent = await opendir('/images');
      let totalSize = 0;
      let count = 0;
      for await (const dirent of dircontent) {
        if (dirent.isFile() && dirent.name.endsWith('.jpg')) {
          const _stat = await stat(join('/images', dirent.name));
          totalSize += _stat.size;
          count += 1;
        }
      }
      imageTotalFileBytesCountGauge.set(totalSize);
      imageTotalFilesCountGauge.set(count);
    } catch (err) {
      this.logger.error(err, 'Error when collect metrics for /image dir');
    }
    this.logger.info('Collect metrics for /image dir finished');
  }
  private removeOldImagesRun = false;
  @Cron('45 * * * * *')
  async removeOldImages() {
    if (this.removeOldImagesRun) return;
    try {
      this.removeOldImagesRun = true;
      const minutesAgo = new Date(Date.now() - 60000 * 10);
      const unasccesedImages = await this.uploadedImageRepository.find({
        where: { lastAccessDate: null, date: LessThan(minutesAgo) },
      });

      this.logger.info(
        `Found ${unasccesedImages.length} unaccessed images more then 10 minutes old`,
      );
      for (const item of unasccesedImages) {
        await this.deleteImage(item);
        this.logger.info(`Image id = ${item.id} deleted`);
      }
      const tenMinlastaccImages = await this.uploadedImageRepository.find({
        where: { lastAccessDate: LessThan(minutesAgo) },
      });
      this.logger.info(
        `Found ${unasccesedImages.length} images with more then 10 minutes last access`,
      );

      for (const item of tenMinlastaccImages) {
        await this.deleteImage(item);
        this.logger.info(`Image id = ${item.id} deleted`);
      }
    } catch (err) {
      this.logger.error(err, 'Unexpected error when remove old images');
    } finally {
      this.removeOldImagesRun = false;
    }
  }

  private async deleteImage(data: UploadedImage) {
    try {
      await this.uploadedImageRepository.delete({ id: data.id });
    } catch (err) {
      this.logger.error(
        err,
        `Error when deleting record id: ${data?.id} from db`,
      );
    }

    try {
      await this.ImageMetadataModel.findOneAndDelete({ id: data.id });
    } catch (error) {
      this.logger.error(
        error,
        `Error when delete image id: ${data?.id} metadata from db`,
      );
    }

    try {
      const path = join('/images', data.filename);
      await unlink(path);
      imageDeletedCountCounter.inc(1);
    } catch (error) {
      this.logger.error(
        error,
        `Error when delete image id: ${data?.id} from disk`,
      );
    }
  }
}
