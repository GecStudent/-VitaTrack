# Multi-stage build for VitaTrack AI Services

# ===== BUILD STAGE =====
FROM python:3.10-slim AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# ===== PRODUCTION STAGE =====
FROM python:3.10-slim AS production

# Set working directory
WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 python && \
    useradd -u 1001 -g python -s /bin/bash -m python

# Copy virtual environment from builder stage
COPY --from=builder --chown=python:python /opt/venv /opt/venv

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy application code
COPY --from=builder --chown=python:python /app /app

# Set user
USER python

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl --fail http://localhost:5000/health || exit 1

# Start application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]