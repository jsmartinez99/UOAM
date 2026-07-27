import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UOAM Arranger Ecosystem API',
      version: '1.0.0',
      description: 'API para el análisis, hibridación y generación de arreglos musicales.',
    },
    components: {
      schemas: {
        Dimensions6D: {
          type: 'object',
          properties: {
            organology: { type: 'array', items: { type: 'string' } },
            harmony: { type: 'array', items: { type: 'string' } },
            counterpoint: { type: 'array', items: { type: 'string' } },
            texture: { type: 'array', items: { type: 'string' } },
            rhythm: { type: 'array', items: { type: 'string' } },
            taste: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
  apis: ['./src/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
