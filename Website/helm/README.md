# VitaTrack Helm Charts

This directory contains Helm charts for deploying the VitaTrack platform on Kubernetes, as described in the [system-architecture.mermaid](../../Architecture/system-architecture.mermaid) diagram.

## Structure
- `vitatrack/` — Umbrella chart for full application deployment
- `backend/` — Backend API service chart
- `frontend/` — Frontend web application chart
- `ai-services/` — AI services chart
- `monitoring/` — Monitoring stack chart (Prometheus, Grafana)

Each chart is templated for environment-specific values and includes resource configuration, probes, and service discovery. Hooks for database migrations, backups, and maintenance are included where relevant. 