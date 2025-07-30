#!/bin/bash

# Redis Cluster Setup for VitaTrack
# This script sets up a Redis Cluster with 3 master nodes and 3 replica nodes

# Exit on error
set -e

# Configuration
REDIS_VERSION="7.0.5"
CLUSTER_DIR="/opt/redis-cluster"
REDIS_PORT_START=7000
NUM_MASTERS=3
NUM_REPLICAS=1  # Per master
REDIS_PASSWORD="${REDIS_PASSWORD}"

echo "Setting up Redis Cluster for VitaTrack..."

# Create cluster directory
mkdir -p ${CLUSTER_DIR}

# Download and compile Redis if not already installed
if [ ! -f /usr/local/bin/redis-server ]; then
  echo "Installing Redis ${REDIS_VERSION}..."
  cd /tmp
  curl -O http://download.redis.io/releases/redis-${REDIS_VERSION}.tar.gz
  tar xzf redis-${REDIS_VERSION}.tar.gz
  cd redis-${REDIS_VERSION}
  make
  make install
fi

# Create nodes
for i in $(seq 0 $((NUM_MASTERS * (NUM_REPLICAS + 1) - 1))); do
  PORT=$((REDIS_PORT_START + i))
  NODE_DIR="${CLUSTER_DIR}/${PORT}"
  
  echo "Setting up node on port ${PORT}..."
  mkdir -p ${NODE_DIR}
  
  # Create redis.conf for this node
  cat > ${NODE_DIR}/redis.conf <<EOF
port ${PORT}
cluster-enabled yes
cluster-config-file nodes-${PORT}.conf
cluster-node-timeout 5000
appendonly yes
requirepass ${REDIS_PASSWORD}
masterauth ${REDIS_PASSWORD}
protected-mode no
bind 0.0.0.0
daemonize yes
dir ${NODE_DIR}
logfile ${NODE_DIR}/redis.log
pidfile ${NODE_DIR}/redis.pid
maxmemory 1gb
maxmemory-policy allkeys-lru
EOF

  # Start Redis server
  redis-server ${NODE_DIR}/redis.conf
done

# Wait for all nodes to start
sleep 5

# Create cluster
echo "Creating Redis Cluster..."
NODES=""
for i in $(seq 0 $((NUM_MASTERS * (NUM_REPLICAS + 1) - 1))); do
  PORT=$((REDIS_PORT_START + i))
  NODES="${NODES}127.0.0.1:${PORT} "
done

redis-cli --cluster create ${NODES} --cluster-replicas ${NUM_REPLICAS} -a ${REDIS_PASSWORD}

echo "Redis Cluster setup complete!"
echo "Cluster consists of ${NUM_MASTERS} masters and $((NUM_MASTERS * NUM_REPLICAS)) replicas"
echo "Ports: ${REDIS_PORT_START} to $((REDIS_PORT_START + NUM_MASTERS * (NUM_REPLICAS + 1) - 1))"