import { z } from 'zod';
import { insertGroupSchema, createExpenseSchema, insertSettlementSchema, groups, expenses, settlements, groupMembers } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  groups: {
    list: {
      method: 'GET' as const,
      path: '/api/groups',
      responses: {
        200: z.array(z.custom<typeof groups.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/groups',
      input: insertGroupSchema,
      responses: {
        201: z.custom<typeof groups.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/groups/:id',
      responses: {
        200: z.custom<typeof groups.$inferSelect & { members: any[] }>(), // Using any[] for members relation for now to simplify
        404: errorSchemas.notFound,
      },
    },
    join: {
      method: 'POST' as const,
      path: '/api/groups/:id/join',
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    }
  },
  expenses: {
    list: {
      method: 'GET' as const,
      path: '/api/groups/:groupId/expenses',
      responses: {
        200: z.array(z.custom<typeof expenses.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/groups/:groupId/expenses',
      input: createExpenseSchema.omit({ groupId: true, paidBy: true }), // groupId from URL, paidBy from auth
      responses: {
        201: z.custom<typeof expenses.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/expenses/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  settlements: {
    list: {
      method: 'GET' as const,
      path: '/api/groups/:groupId/settlements',
      responses: {
        200: z.array(z.custom<typeof settlements.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/groups/:groupId/settlements',
      input: insertSettlementSchema.omit({ groupId: true, fromUserId: true }), // fromUserId from auth
      responses: {
        201: z.custom<typeof settlements.$inferSelect>(),
      },
    },
  },
  subscription: {
    get: {
      method: 'GET' as const,
      path: '/api/subscription',
      responses: {
        200: z.object({ plan: z.string(), status: z.string() }),
      },
    },
    upgrade: {
      method: 'POST' as const,
      path: '/api/subscription/upgrade',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
