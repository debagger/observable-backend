import * as promBundle from 'express-prom-bundle';
import * as promClient from 'prom-client';
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

export const metricsClient = promClient;

export const imageReadCountCounter = new promClient.Counter({
  name: 'image_file_read_count',
  help: 'Image files reads count',
});

export const imageReadBytesCounter = new promClient.Counter({
  name: 'image_file_read_bytes',
  help: 'Image files reads bytes',
});

export const imageWriteCountCounter = new promClient.Counter({
  name: 'image_file_write_count',
  help: 'Image files writes count',
});

export const imageWriteBytesCounter = new promClient.Counter({
  name: 'image_file_write_bytes',
  help: 'Image files writes bytes',
});

export const imageDeletedCountCounter = new promClient.Counter({
  name: 'image_file_deleted_count',
  help: 'Image files deleted count',
});

export const imageTotalFilesCountGauge = new promClient.Gauge({
  name: 'image_total_files_count',
  help: 'Image total files in /image directory',
});

export const imageTotalFileBytesCountGauge = new promClient.Gauge({
  name: 'image_total_files_bytes',
  help: 'Image total files size in /image directory',
});

if (metricsMiddleware) {
  console.log('Metrics enabled');
} else {
  console.log(
    'Metrics disabled. To enable metrics set env PROM_METRICS_ENABLE: "true"',
  );
}
