# VitaTrack Kubernetes Deployment

This directory contains the Kubernetes configuration for deploying the VitaTrack platform, as described in the [system-architecture.mermaid](../../Architecture/system-architecture.mermaid) diagram.

## Structure
- `namespaces/` — Namespace definitions for dev, staging, prod
- `rbac/` — Role-based access control policies
- `network-policies/` — Network security policies
- `ingress/` — Ingress controllers and SSL setup
- `monitoring/` — Monitoring setup (Prometheus, Grafana)

## Overview
These manifests are designed to:
- Isolate environments (dev, staging, prod)
- Enforce security via RBAC and network policies
- Provide ingress with SSL termination
- Enable monitoring and observability

Refer to the architecture diagram for service relationships and data flow. 