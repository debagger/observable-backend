import * as promBundle from 'express-prom-bundle';

export const metricsEnable = process.env.PROM_METRICS_ENABLE === 'true';

console.log('PROM_METRICS_ENABLE =', process.env.PROM_METRICS_ENABLE);

export const metricsMiddleware = metricsEnable
  ? promBundle({
      includeMethod: true,
      promClient: {
        collectDefaultMetrics: {},
      },
    })
  : undefined;
if (metricsMiddleware) {
  console.log('Metrics enabled');
} else {
  console.log(
    'Metrics disabled. To enable metrics set env PROM_METRICS_ENABLE: "true"',
  );
}
