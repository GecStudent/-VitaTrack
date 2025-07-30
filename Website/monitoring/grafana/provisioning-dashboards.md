# Grafana Dashboard Provisioning

- Place dashboard JSON files in the `dashboards/` directory.
- Use Grafana provisioning config to automatically load dashboards at startup.
- Example provisioning config:

```yaml
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
``` 