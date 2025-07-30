# VitaTrack Backend Testing Suite

## Overview

This directory contains the comprehensive testing suite for the VitaTrack backend services. The testing suite includes unit tests, integration tests, API tests, database tests, performance tests, and security tests.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── auth/               # Authentication-related unit tests
│   ├── api/                # API-related unit tests
│   ├── middleware/         # Middleware unit tests
│   └── services/           # Service unit tests
├── integration/            # Integration tests for component interactions
│   ├── database/           # Database integration tests
│   └── cache/              # Cache integration tests
├── api/                    # API endpoint tests
│   ├── auth/               # Authentication API tests
│   ├── food/               # Food API tests
│   ├── meals/              # Meals API tests
│   └── exercise/           # Exercise API tests
├── performance/            # Performance and load tests
├── security/               # Security tests
├── fixtures/               # Test fixtures and data
└── utils/                  # Test utilities and helpers
```

## Running Tests

### Prerequisites

- Node.js 16+
- npm or yarn
- Docker (for integration tests with test containers)

### Install Dependencies

```bash
npm install
```

### Running All Tests

```bash
npm test
```

### Running Specific Test Types

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# API tests only
npm run test:api

# Security tests only
npm run test:security

# Performance tests
npm run test:performance

# Load tests
npm run test:load
```

### Test Coverage

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Test Environment

Tests run in a controlled environment with:

- In-memory MongoDB using `mongodb-memory-server`
- Redis container using `testcontainers`
- Mocked external services

## Mocking Strategies

### Database Mocking

- **Unit tests**: Jest mocks
- **Integration tests**: In-memory databases

### External Service Mocking

- **API tests**: Mock responses for external services
- **Integration tests**: Test containers for dependent services

## Test Data Management

Test fixtures are stored in the `fixtures/` directory and provide consistent test data across all test types.

## Continuous Integration

Tests are automatically run in the CI pipeline using:

```bash
npm run test:ci
```

This generates JUnit XML reports for CI integration.

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on the state from other tests.

2. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification phases.

3. **Mock External Dependencies**: Use mocks for external services to ensure tests are reliable.

4. **Test Coverage**: Aim for at least 70% code coverage across all components.

5. **Performance Testing**: Include performance tests for critical endpoints.

6. **Security Testing**: Include security tests for authentication and authorization.

7. **Test Naming**: Use descriptive test names that explain what is being tested.

8. **Test Organization**: Group related tests together in describe blocks.

9. **Test Fixtures**: Use fixtures for consistent test data.

10. **Test Environment**: Use a dedicated test environment that mimics production.

## Troubleshooting

### Common Issues

1. **Connection Errors**: Ensure Docker is running for integration tests.

2. **Timeout Errors**: Increase the timeout in Jest configuration for slow tests.

3. **Memory Issues**: Run tests with `--maxWorkers=2` to reduce memory usage.

## Contributing

When adding new tests:

1. Follow the existing directory structure
2. Use the appropriate test fixtures
3. Ensure tests are isolated and don't depend on other tests
4. Add appropriate mocks for external dependencies
5. Update this documentation if necessary

## Test Suite Features

This comprehensive testing suite includes:

1. **Directory Structure**: Organized test directories for unit, integration, API, performance, and security tests.

2. **Jest Configuration**: Set up Jest with TypeScript support, coverage reporting, and test reporters.

3. **Test Setup**: Created a setup file for test environment configuration, including in-memory databases.

4. **Test Utilities**: Added helper functions for authentication, mocking, and test data management.

5. **Test Fixtures**: Created fixtures for consistent test data across all test types.

6. **Unit Tests**: Added tests for middleware and authentication components.

7. **API Tests**: Added tests for the food search endpoint.

8. **Integration Tests**: Added tests for database connections.

9. **Performance Tests**: Added K6 tests for load testing the food search endpoint.

10. **Security Tests**: Added tests for authentication security.

11. **Test Scripts**: Updated package.json with various test commands.

12. **Documentation**: Comprehensive testing documentation with best practices.

This testing suite provides a solid foundation for ensuring the reliability, performance, and security of the VitaTrack backend services. The tests cover all critical components and can be easily extended as new features are added.
