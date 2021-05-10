# Observable backend demo project
Project for [this](https://habr.com/ru/company/macloud/blog/556518/) post at habr.com 

Shows how to   
* Collect Metrics (Prometheus)
* Collect logs
* Collect traces

for Nest.js project. 

Here is simple Nest.js service, which recieves images, parse and save its metadata to database (Mongo and Posges).

## How to use

Run project without any monitoring:
```
docker-compose -f docker-compose.nomon.yml up -d
```

Run project with metrics (Prometheus and Grafana):
```
docker-compose -f docker-compose.metrics.yml up -d
```

Run project with metrics and collecting logs (Prometheus, Loki and Grafana):
```
docker-compose -f docker-compose.metrics_logs.yml up -d
```

Run project with full monitoring (tempo traces) (Prometheus, Loki, Tempo and Grafana):
```
docker-compose -f docker-compose.metrics_logs_tempo.yml up -d
```

Run project with full monitoring (jaeger traces) (Prometheus, Loki, Jaeger and Grafana):
```
docker-compose -f docker-compose.metrics_logs_jaeger.yml up -d
```


## Warning!

Its just demo project with most security options disabled. Do not use its as is for production purposes.  
