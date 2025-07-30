import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VitaTrack API',
      version: '1.0.0',
      description: 'API documentation for VitaTrack backend',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        // Add more common schemas here as needed
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, '../src/api/**/*.ts'),
    path.join(__dirname, './**/*.ts'),
  ],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec; 