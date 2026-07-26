import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UOAM Arranger Ecosystem API',
      version: '1.0.0',
      description: 'API para el análisis, hibridación y generación de arreglos musicales.',
    },
  },
  apis: ['./src/backend/controllers.ts'], // Ajustar según donde estén los controladores
};

export const swaggerSpec = swaggerJsdoc(options);
