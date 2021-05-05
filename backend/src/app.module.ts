import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadedImage } from './uploadedImage.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { ImageMetadata, ImageMetadataSchema } from './imageMetadata.shema';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { LoggerModule } from 'nestjs-pino';
import { Request, Response } from 'express';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        reqCustomProps: (req: Request, res: Response) => {
          const traceID = res.getHeader('trace-id');
          console.log(`reqCustomProps traceID = ${traceID}`);
          return { traceID };
        },
      },
    }),
    MongooseModule.forRoot('mongodb://mongo/images'),
    MongooseModule.forFeature([
      { name: ImageMetadata.name, schema: ImageMetadataSchema },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db',
      port: 5432,
      username: 'images',
      password: 'password',
      database: 'images',
      entities: [UploadedImage],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([UploadedImage]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, CronService],
})
export class AppModule {}
