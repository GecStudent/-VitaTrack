import swaggerJSDoc from 'swagger-jsdoc';
import { getConfig } from '../config';

const config = getConfig();

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'VitaTrack API',
    version: '1.0.0',
    description: 'API for VitaTrack health and fitness tracking application',
    contact: {
      name: 'VitaTrack Support',
      email: 'support@vitatrack.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: '/api',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string'
              },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string'
                    },
                    path: {
                      type: 'array',
                      items: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: {
            type: 'number',
            description: 'Total number of items'
          },
          page: {
            type: 'number',
            description: 'Current page number'
          },
          limit: {
            type: 'number',
            description: 'Number of items per page'
          },
          totalPages: {
            type: 'number',
            description: 'Total number of pages'
          }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string'
          },
          data: {
            type: 'object'
          }
        }
      },
      PaginatedResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/ApiResponse'
          },
          {
            type: 'object',
            properties: {
              pagination: {
                $ref: '#/components/schemas/PaginationMeta'
              }
            }
          }
        ]
      },
      // Food schemas
      ServingSize: {
        type: 'object',
        properties: {
          size: {
            type: 'number'
          },
          unit: {
            type: 'string'
          },
          weight_g: {
            type: 'number'
          }
        }
      },
      Nutrition: {
        type: 'object',
        properties: {
          calories: {
            type: 'number'
          },
          protein_g: {
            type: 'number'
          },
          carbs_g: {
            type: 'number'
          },
          fat_g: {
            type: 'number'
          },
          fiber_g: {
            type: 'number'
          },
          sugar_g: {
            type: 'number'
          },
          sodium_mg: {
            type: 'number'
          }
        }
      },
      Food: {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
          name: {
            type: 'string'
          },
          description: {
            type: 'string'
          },
          brand: {
            type: 'string'
          },
          barcode: {
            type: 'string'
          },
          categories: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          serving_sizes: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ServingSize'
            }
          },
          nutrition_per_100g: {
            $ref: '#/components/schemas/Nutrition'
          },
          verified: {
            type: 'boolean'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Options for the swagger docs
const options: swaggerJSDoc.Options = {
  // Import swaggerDefinitions
  swaggerDefinition,
  // Path to the API docs
  apis: [
    './src/api/**/*.ts',
    './src/docs/**/*.yaml',
    './src/docs/**/*.ts'
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;