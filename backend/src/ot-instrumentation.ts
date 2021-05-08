import { NodeTracerProvider } from '@opentelemetry/node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { BatchSpanProcessor } from '@opentelemetry/tracing';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { MongooseInstrumentation } from 'opentelemetry-instrumentation-mongoose';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { trace } from '@opentelemetry/api';

export const openTelemetryEnabled = process.env.OT_TRACING_ENABLED === 'true';
export const openTelemetryHost = process.env.OT_TRACING_HOST;

console.log('OT_TRACING_ENABLED =', process.env.OT_TRACING_ENABLED);
console.log('OT_TRACING_HOST = ', process.env.OT_TRACING_HOST);

function enableOTInstrumentation() {
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
}

if (openTelemetryEnabled) {
  if (openTelemetryHost) {
    enableOTInstrumentation();
  } else {
    console.log(
      'To enable OpenTelemetry tracing add OT_TRACING_HOST evironment variable',
    );
  }
} else {
  console.log(
    'OpenTelemetry tracing disabled. To enable OpenTelemetry tracing set OT_TRACING_ENABLED to "true"' +
      ' and add OT_TRACING_HOST evironment variable',
  );
}

export const tracer =
  openTelemetryEnabled && openTelemetryHost
    ? trace.getTracer('backend')
    : undefined;
