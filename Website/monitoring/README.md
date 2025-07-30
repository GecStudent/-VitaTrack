# VitaTrack Monitoring & Logging Infrastructure

This directory contains monitoring and logging configuration for VitaTrack, as described in the [system-architecture.mermaid](../Architecture/system-architecture.mermaid) diagram.

## Structure
- `prometheus/` — Prometheus configuration for metrics collection
- `grafana/` — Grafana dashboards and provisioning
- `elasticsearch/` — Elasticsearch setup for log storage
- `dashboards/` — Custom dashboards for business, SLA, and ops metrics
- `alerts/` — AlertManager rules and notification configs

## Overview
This setup provides:
- Metrics, logs, and alerting for all VitaTrack components
- Centralized log aggregation and retention
- Custom dashboards for operational and business insights
- SLA and performance monitoring 