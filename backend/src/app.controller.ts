import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
  Request,
  Response,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { AppService } from './app.service';
import {
  Express,
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import { createReadStream } from 'fs';
import { stat, access } from 'fs/promises';
import { imageReadBytesCounter, imageReadCountCounter } from './prom-metrics';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/images/:id.jpg')
  async getImage(@Param('id') id: string, @Response() resp: ExpressResponse) {
    const intId = Number(id);
    if (!Number.isInteger(intId))
      throw new NotFoundException(
        `id is '${id}'.jpg must contains only numbers`,
      );
    const imageInfo = await this.appService.getImageInfo(intId);
    if (!imageInfo.info)
      throw new NotFoundException(`Image '${id}' not found by the service`);
    const path = join('/images', imageInfo.info.filename);
    try {
      await access(path);
    } catch (error) {
      throw new NotFoundException('File not found');
    }

    const fileStat = await stat(path);
    resp.setHeader('content-length', fileStat.size);
    resp.setHeader('content-type', 'image/jpeg');

    const stream = createReadStream(path);
    stream.pipe(resp);
    stream.once('end', () => {
      imageReadCountCounter.inc(1);
      imageReadBytesCounter.inc(fileStat.size);
    });
  }

  @Get('info/:id')
  async getInfo(@Param('id') id: string) {
    const intId = Number(id);
    if (!Number.isInteger(intId))
      throw new NotFoundException(`id is '${id}' but must be an integer`);
    return this.appService.getImageInfo(intId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Request() req: ExpressRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file.mimetype !== 'image/jpeg')
      throw new UnsupportedMediaTypeException(
        "Only 'image/jpeg' mimetype supported",
      );

    try {
      //const metadata = await this.appService.getImageMetadata(file.buffer);
      const saveResult = await this.appService.saveImage(
        file.buffer,
        req.socket.remoteAddress,
      );
      return saveResult;
    } catch (error) {
      throw new BadRequestException(error.toString());
    }
  }
}
