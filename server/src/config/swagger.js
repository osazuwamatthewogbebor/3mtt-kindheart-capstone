import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KindHeart API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the KindHeart Crowdfunding Platform. This API handles authentication, campaign management, donations, and administrative tasks.',
      contact: {
        name: 'KindHeart Support',
        url: 'https://kindheart.org',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current environment (Relative)',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://kindheart-api.onrender.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        GatekeeperAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-gatekeeper-password',
          description: 'Gatekeeper password for accessing the documentation itself.',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            isVerified: { type: 'boolean' },
            profileImageUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Campaign: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            goalAmount: { type: 'number' },
            amountRaised: { type: 'number' },
            campaignStatus: { type: 'string', enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] },
            endDate: { type: 'string', format: 'date-time' },
            imageUrl: { type: 'string' },
            categoryId: { type: 'string', format: 'uuid' },
            creatorId: { type: 'string', format: 'uuid' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
          },
        },
        Donation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'] },
            campaignId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Osas Matthew' },
                    email: { type: 'string', format: 'email', example: 'donor@example.com' },
                    password: { type: 'string', format: 'password', example: 'Password123' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered successfully' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'donor@example.com' },
                    password: { type: 'string', example: 'Password123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/google': {
        get: {
          tags: ['Auth'],
          summary: 'Initiate Google OAuth login',
          responses: {
            302: { description: 'Redirect to Google login page' },
          },
        },
      },
      '/api/auth/refresh-token': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh authentication token',
          responses: {
            200: { description: 'Token refreshed' },
          },
        },
      },
      '/api/auth/verify-email': {
        get: {
          tags: ['Auth'],
          summary: 'Verify email address',
          parameters: [
            { name: 'token', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Email verified' },
            400: { description: 'Invalid token' },
          },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request password reset email',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' } } } } }
          },
          responses: {
            200: { description: 'Reset email sent' },
          },
        },
      },
      '/api/auth/reset-password/{token}': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password using token',
          parameters: [
            { name: 'token', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { password: { type: 'string' } } } } }
          },
          responses: {
            200: { description: 'Password reset successful' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Logged out successfully' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { 
              description: 'User profile retrieved',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
            },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/auth/admin': {
        get: {
          tags: ['Auth'],
          summary: 'Check admin access',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Admin access confirmed' },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/api/campaigns': {
        get: {
          tags: ['Campaigns'],
          summary: 'List all campaigns',
          responses: {
            200: { description: 'List of campaigns retrieved' },
          },
        },
        post: {
          tags: ['Campaigns'],
          summary: 'Create a new campaign',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    categoryId: { type: 'string' },
                    goalAmount: { type: 'number' },
                    endDate: { type: 'string', format: 'date-time' },
                    image: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Campaign created' },
          },
        },
      },
      '/api/campaigns/search': {
        get: {
          tags: ['Campaigns'],
          summary: 'Search campaigns',
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Search results' },
          },
        },
      },
      '/api/campaigns/{id}': {
        get: {
          tags: ['Campaigns'],
          summary: 'Get campaign by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Campaign details' } }
        },
        put: {
          tags: ['Campaigns'],
          summary: 'Update campaign details',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } } } } }
          },
          responses: { 200: { description: 'Campaign updated' } }
        }
      },
      '/api/campaigns/{id}/image': {
        patch: {
          tags: ['Campaigns'],
          summary: 'Update campaign image',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } } }
          },
          responses: { 200: { description: 'Image updated' } }
        }
      },
      '/api/donations': {
        post: {
          tags: ['Donations'],
          summary: 'Make a donation',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    campaignId: { type: 'string' },
                    amount: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Donation initiated' },
          },
        },
      },
      '/api/donations/me': {
        get: {
          tags: ['Donations'],
          summary: 'Get my donations',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of my donations' } }
        }
      },
      '/api/donations/verify-payment': {
        get: {
          tags: ['Donations'],
          summary: 'Verify payment redirect',
          parameters: [{ name: 'reference', in: 'query', schema: { type: 'string' } }],
          responses: { 200: { description: 'Payment verified' } }
        }
      },
      '/api/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Get platform stats',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Stats retrieved' },
          },
        },
      },
      '/api/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'List all users',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of users' } }
        }
      },
      '/api/admin/campaigns': {
        get: {
          tags: ['Admin'],
          summary: 'List all campaigns (Admin view)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of campaigns' } }
        }
      },
      '/api/admin/campaigns/bulk/status': {
        put: {
          tags: ['Admin'],
          summary: 'Bulk update campaign status',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } }, status: { type: 'string' } } } } }
          },
          responses: { 200: { description: 'Bulk update successful' } }
        }
      },
      '/api/admin/campaigns/{id}/status': {
        put: {
          tags: ['Admin'],
          summary: 'Update campaign status',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' } } } } }
          },
          responses: { 200: { description: 'Status updated' } }
        }
      },
      '/api/admin/categories': {
        get: {
          tags: ['Admin'],
          summary: 'List categories',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Categories retrieved' },
          },
        },
        post: {
          tags: ['Admin'],
          summary: 'Create category',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } }
          },
          responses: {
            201: { description: 'Category created' },
          },
        },
      },
      '/api/admin/categories/{id}': {
        put: {
          tags: ['Admin'],
          summary: 'Update category',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } }
          },
          responses: { 200: { description: 'Category updated' } }
        },
        delete: {
          tags: ['Admin'],
          summary: 'Delete category',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Category deleted' } }
        }
      },
      '/api/projects': {
        get: {
          tags: ['Projects'],
          summary: 'Check if projects route is active',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Active' } }
        },
        post: {
          tags: ['Projects'],
          summary: 'Create project',
          security: [{ bearerAuth: [] }],
          responses: { 201: { description: 'Project created' } }
        }
      },
      '/api/projects/{projectId}/donate': {
        post: {
          tags: ['Projects'],
          summary: 'Donate to project',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 201: { description: 'Donation submitted' } }
        }
      },
      '/api/users/me/image': {
        patch: {
          tags: ['Users'],
          summary: 'Update my profile image',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } } }
          },
          responses: { 200: { description: 'Profile image updated' } }
        }
      },
      '/api/upload/{public_id}': {
        delete: {
          tags: ['Upload'],
          summary: 'Delete upload by public ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'public_id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Upload deleted' } }
        }
      },
      '/api/payments/webhook': {
        post: {
          tags: ['Payments'],
          summary: 'Paystack Webhook',
          responses: { 200: { description: 'Webhook processed' } }
        }
      },
      '/api/health': {
        get: {
          tags: ['Checks'],
          summary: 'Health check',
          responses: {
            200: { description: 'Server is healthy' },
          },
        },
      },
    },
  },
  apis: [], 
};

export const swaggerSpec = swaggerJsdoc(options);
