# Observable backend demo project
Show how to add  
* Metrics (Prometheus)
* Collect logs
* Collect traces
to Nest.js project. 
Here is simple Nest.js service, which recieves images, parse and save its metadata to database (Mongo and Posges).

# How to use

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

Run project with full monitoring (Prometheus, Loki, Tempo and Grafana):
```
docker-compose up -d
```