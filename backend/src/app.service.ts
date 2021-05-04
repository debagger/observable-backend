import { Catch, Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import * as exifReader from 'exif-reader';
import * as icc from 'icc';
import { IptcParser } from 'ts-node-iptc';
import { parseString as xmlParse } from 'xml2js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadedImage } from './uploadedImage.entity';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { InjectModel } from '@nestjs/mongoose';
import { ImageMetadata, ImageMetadataDocument } from './imageMetadata.shema';
import { LeanDocument, Model } from 'mongoose';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(UploadedImage)
    private uploadedImageRepository: Repository<UploadedImage>,
    @InjectModel(ImageMetadata.name)
    private ImageMetadataModel: Model<ImageMetadataDocument>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  private async getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    const meta = await sharp(buffer).metadata();
    if (meta.exif) {
      try {
        meta.exif = exifReader(meta.exif);
      } catch (err) {
        //todo log error
      }
    }
    if (meta.icc) {
      try {
        meta.icc = icc.parse(meta.icc);
      } catch (err) {}
    }

    if (meta.iptc) {
      try {
        meta.iptc = IptcParser.readIPTCData(meta.iptc) as Buffer;
      } catch (err) {}
    }

    if (meta.xmp) {
      try {
        const xpmString = meta.xmp.toString('utf8');
        const decodedXmp = await new Promise((resolve, reject) =>
          xmlParse(xpmString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }),
        );
        meta.xmp = decodedXmp as Buffer;
      } catch (error) {}
    }

    return meta;
  }

  async saveImage(buf: Buffer, ip: string) {
    const uploadedImage = new UploadedImage();
    uploadedImage.date = new Date();
    uploadedImage.size = buf.byteLength;
    uploadedImage.ip = ip;
    await this.uploadedImageRepository.save([uploadedImage]);

    const id = uploadedImage.id;
    const filename =
      new Intl.NumberFormat('en-US', {
        minimumIntegerDigits: 8,
        useGrouping: false,
      }).format(id) + '.jpg';
    const path = join('/images', filename);
    await writeFile(path, buf);

    uploadedImage.filename = filename;
    await this.uploadedImageRepository.save([uploadedImage]);

    await this.saveImageMetadata(buf, id);

    return uploadedImage;
  }

  private async saveImageMetadata(buf: Buffer, id: number) {
    try {
      const clear$ = function (obj: object) {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const element = obj[key];
            if (typeof element === 'object') {
              clear$(element);
            }
            if (key.startsWith('$')) {
              delete obj[key];
              obj['_' + key] = element;
            }
          }
        }
      };
      const meta = await this.getImageMetadata(buf);
      clear$(meta);
      const createdMeta = new this.ImageMetadataModel(meta);
      createdMeta.id = id;
      await createdMeta.save();
    } catch (error) {
      console.log(error);
    }
  }

  async getImageInfo(id: number) {
    const result = {} as {info?:UploadedImage, metadata?:LeanDocument<ImageMetadataDocument>};
    const imginfo = await this.uploadedImageRepository.findOne({ id });
    result.info = imginfo;
    if (imginfo) {
      imginfo.lastAccessDate = new Date();
      await this.uploadedImageRepository.save([imginfo]);
      const meta = await this.ImageMetadataModel.findOne({ id }).exec();
      result.metadata = meta.toObject();
    }
    return result;
  }
}
