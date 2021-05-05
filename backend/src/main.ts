//Instrumentation must be setup before first require of Express
import { tracer, openTelemetryEnabled } from './ot-instrumentation';
import { metricsEnable, metricsMiddleware } from './prom-metrics';
import { Logger } from 'nestjs-pino';

import { Request, Response, NextFunction } from 'express';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });
  //Add trace-id header to response if openTelemetry tracing enabled
  if (openTelemetryEnabled) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const span = tracer.startSpan('Add trace-id header');
      const traceId = span.context().traceId;
      res.setHeader('trace-id', traceId);
      next();
      span.end();
    });
  }
  //Add metrics if enabled
  if (metricsEnable) {
    app.use(metricsMiddleware);
  }
  app.useLogger(app.get(Logger));

  await app.listen(3000);
  console.log('App started');
}
bootstrap();
