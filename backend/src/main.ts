
import * as promBundle from 'express-prom-bundle';

import { NodeTracerProvider } from '@opentelemetry/node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { BatchSpanProcessor } from '@opentelemetry/tracing';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { MongooseInstrumentation } from 'opentelemetry-instrumentation-mongoose';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Logger } from 'nestjs-pino';
import { context, getSpan, trace } from '@opentelemetry/api';
import { Request, Response, NextFunction } from 'express';

import * as experss from "express";
import * as http from "http";

const provider = new NodeTracerProvider();
provider.register();

registerInstrumentations({
  instrumentations: [
    // Express instrumentation expects HTTP layer to be instrumented
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new MongooseInstrumentation(),
  ],
  // tracerProvider: provider,
});

provider.addSpanProcessor(
  new BatchSpanProcessor(
    new JaegerExporter({
      host: 'tempo',
      port: 6832,
      serviceName: 'backend',
    }),
  ),
);

const tracer = trace.getTracer('backend');

const metricsMiddleware = promBundle({
  includeMethod: true,
  promClient: {
    collectDefaultMetrics: {},
  },
});

const addTraceId = (req: Request, res: Response, next: NextFunction) => {
  const span = tracer.startSpan('TracingInterceptor');
  const traceId = span.context().traceId;
  res.setHeader('trace-id', traceId);
  next();
  span.end();
};

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });
  app.use(addTraceId);
  app.useLogger(app.get(Logger));
  app.use(metricsMiddleware);
  await app.listen(3000);
  console.log('App started');
}
bootstrap();
