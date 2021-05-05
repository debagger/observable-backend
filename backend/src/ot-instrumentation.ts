import { NodeTracerProvider } from '@opentelemetry/node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { BatchSpanProcessor } from '@opentelemetry/tracing';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { MongooseInstrumentation } from 'opentelemetry-instrumentation-mongoose';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { trace } from '@opentelemetry/api';

export const openTelemetryEnabled = process.env.OT_TRACING_ENABLED === 'true';

console.log('OT_TRACING_ENABLED =', process.env.OT_TRACING_ENABLED);

if (openTelemetryEnabled) {
  console.log('OpenTelemetry instrmentation setup begins...');
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
  console.log('OpenTelemetry tracing enabled');
} else {
  console.log('OpenTelemetry tracing disabled');
}

export const tracer = openTelemetryEnabled
  ? trace.getTracer('backend')
  : undefined;
