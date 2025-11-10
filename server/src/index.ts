import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: true,
});

// Socket.IO setup
const io = new SocketIOServer(fastify.server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a project room
  socket.on('join:project', (projectId: string) => {
    socket.join(projectId);
    console.log(`Client ${socket.id} joined project ${projectId}`);
  });

  // Leave a project room
  socket.on('leave:project', (projectId: string) => {
    socket.leave(projectId);
    console.log(`Client ${socket.id} left project ${projectId}`);
  });

  // Task create event
  socket.on('task:create', async (data: { projectId: string; task: any }) => {
    io.to(data.projectId).emit('task:created', data.task);
  });

  // Task update event
  socket.on('task:update', async (data: { projectId: string; task: any }) => {
    io.to(data.projectId).emit('task:updated', data.task);
  });

  // Task delete event
  socket.on('task:delete', async (data: { projectId: string; taskId: string }) => {
    io.to(data.projectId).emit('task:deleted', { taskId: data.taskId });
  });

  // Task move event (between lists + order)
  socket.on('task:move', async (data: { projectId: string; task: any }) => {
    io.to(data.projectId).emit('task:moved', data.task);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(1).max(50),
});

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
});

const createListSchema = z.object({
  name: z.string().min(1).max(100),
  projectId: z.string(),
  order: z.number().optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  listId: z.string(),
  order: z.number().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  listId: z.string().optional(),
  order: z.number().optional(),
});

const moveTaskSchema = z.object({
  listId: z.string(),
  order: z.number(),
});

// Middleware to get user from header
const getUserFromHeader = async (request: any, reply: any) => {
  const username = request.headers['x-username'];
  if (!username) {
    reply.code(401).send({ error: 'x-username header is required' });
    return null;
  }

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { username: username as string },
  });

  if (!user) {
    // Auto-create user if they don't exist
    user = await prisma.user.create({
      data: { username: username as string },
    });
    console.log('Auto-created user:', user.username);

    // Auto-create a default project with lists for new users
    const project = await prisma.project.create({
      data: {
        name: 'My Task Board',
        ownerId: user.id,
        lists: {
          create: [
            { name: 'To Do', order: 0 },
            { name: 'In Progress', order: 1 },
            { name: 'Done', order: 2 },
          ],
        },
      },
    });
    console.log('Auto-created default project for user:', user.username);
  }

  return user;
};

// REST API Routes

// Root route
fastify.get('/', async (request, reply) => {
  return {
    message: 'Task Management API',
    version: '1.0.0',
    endpoints: {
      users: {
        'GET /api/me': 'Ensure/create user from x-username header',
        'POST /api/users': 'Create a new user',
        'GET /api/users/me': 'Get current user (requires x-username header)',
      },
      projects: {
        'POST /api/projects': 'Create a new project',
        'GET /api/projects': 'Get all projects for current user',
        'GET /api/projects/:id': 'Get a specific project',
        'GET /api/projects/:id/board': 'Get project board with lists and tasks',
      },
      lists: {
        'POST /api/lists': 'Create a new list',
        'GET /api/lists/:projectId': 'Get all lists for a project',
      },
      tasks: {
        'POST /api/tasks': 'Create a new task',
        'GET /api/tasks/:listId': 'Get all tasks for a list',
        'PATCH /api/tasks/:id': 'Update title/description',
        'POST /api/tasks/:id/move': 'Move task to new list/order',
        'DELETE /api/tasks/:id': 'Delete a task',
      },
    },
    socket: {
      events: ['task:create', 'task:update', 'task:delete', 'task:move'],
    },
  };
});

// GET /api/me - Ensure/create user from x-username header
fastify.get('/api/me', async (request, reply) => {
  const user = await getUserFromHeader(request, reply);
  if (!user) return;

  return reply.send(user);
});

// Users
fastify.post('/api/users', async (request, reply) => {
  try {
    const body = createUserSchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({
      where: { username: body.username },
    });

    if (existingUser) {
      return reply.code(400).send({ error: 'Username already exists' });
    }

    const user = await prisma.user.create({
      data: { username: body.username },
    });

    return reply.code(201).send(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

fastify.get('/api/users/me', async (request, reply) => {
  const user = await getUserFromHeader(request, reply);
  if (!user) return;

  return reply.send(user);
});

// Projects
fastify.post('/api/projects', async (request, reply) => {
  try {
    const user = await getUserFromHeader(request, reply);
    if (!user) return;

    const body = createProjectSchema.parse(request.body);

    const project = await prisma.project.create({
      data: {
        name: body.name,
        ownerId: user.id,
      },
      include: {
        lists: {
          include: {
            tasks: true,
          },
        },
      },
    });

    return reply.code(201).send(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

fastify.get('/api/projects', async (request, reply) => {
  const user = await getUserFromHeader(request, reply);
  if (!user) return;

  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    include: {
      lists: {
        include: {
          tasks: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  return reply.send(projects);
});

fastify.get('/api/projects/:id', async (request, reply) => {
  const user = await getUserFromHeader(request, reply);
  if (!user) return;

  const { id } = request.params as { id: string };

  const project = await prisma.project.findFirst({
    where: { id, ownerId: user.id },
    include: {
      lists: {
        include: {
          tasks: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!project) {
    return reply.code(404).send({ error: 'Project not found' });
  }

  return reply.send(project);
});

// GET /api/projects/:id/board - Get project board with lists and tasks ordered
fastify.get('/api/projects/:id/board', async (request, reply) => {
  const user = await getUserFromHeader(request, reply);
  if (!user) return;

  const { id } = request.params as { id: string };

  const project = await prisma.project.findFirst({
    where: { id, ownerId: user.id },
    include: {
      lists: {
        include: {
          tasks: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!project) {
    return reply.code(404).send({ error: 'Project not found' });
  }

  return reply.send({
    id: project.id,
    name: project.name,
    lists: project.lists,
  });
});

// Lists
fastify.post('/api/lists', async (request, reply) => {
  try {
    const user = await getUserFromHeader(request, reply);
    if (!user) return;

    const body = createListSchema.parse(request.body);

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: body.projectId, ownerId: user.id },
    });

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    const list = await prisma.list.create({
      data: {
        name: body.name,
        projectId: body.projectId,
        order: body.order ?? 0,
      },
      include: {
        tasks: true,
      },
    });

    return reply.code(201).send(list);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

fastify.get('/api/lists/:projectId', async (request, reply) => {
  const user = await getUserFromHeader(request, reply);
  if (!user) return;

  const { projectId } = request.params as { projectId: string };

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: user.id },
  });

  if (!project) {
    return reply.code(404).send({ error: 'Project not found' });
  }

  const lists = await prisma.list.findMany({
    where: { projectId },
    include: {
      tasks: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  return reply.send(lists);
});

// Tasks
fastify.post('/api/tasks', async (request, reply) => {
  try {
    const user = await getUserFromHeader(request, reply);
    if (!user) return;

    const body = createTaskSchema.parse(request.body);

    // Verify list exists and user owns the project
    const list = await prisma.list.findFirst({
      where: {
        id: body.listId,
        project: {
          ownerId: user.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!list) {
      return reply.code(404).send({ error: 'List not found' });
    }

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        listId: body.listId,
        createdById: user.id,
        order: body.order ?? 0,
      },
    });

    // Emit socket event
    io.to(list.projectId).emit('task:created', task);

    return reply.code(201).send(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

fastify.get('/api/tasks/:listId', async (request, reply) => {
  const user = await getUserFromHeader(request, reply);
  if (!user) return;

  const { listId } = request.params as { listId: string };

  // Verify list exists and user owns the project
  const list = await prisma.list.findFirst({
    where: {
      id: listId,
      project: {
        ownerId: user.id,
      },
    },
  });

  if (!list) {
    return reply.code(404).send({ error: 'List not found' });
  }

  const tasks = await prisma.task.findMany({
    where: { listId },
    orderBy: { order: 'asc' },
  });

  return reply.send(tasks);
});

fastify.patch('/api/tasks/:id', async (request, reply) => {
  try {
    const user = await getUserFromHeader(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    const body = updateTaskSchema.parse(request.body);

    // Verify task exists and user owns the project
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        list: {
          project: {
            ownerId: user.id,
          },
        },
      },
      include: {
        list: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!existingTask) {
      return reply.code(404).send({ error: 'Task not found' });
    }

    // If listId is being changed, verify the new list exists
    if (body.listId && body.listId !== existingTask.listId) {
      const newList = await prisma.list.findFirst({
        where: {
          id: body.listId,
          project: {
            ownerId: user.id,
          },
        },
      });

      if (!newList) {
        return reply.code(404).send({ error: 'New list not found' });
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: body,
    });

    // Emit socket event
    io.to(existingTask.list.projectId).emit('task:updated', task);

    return reply.send(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

fastify.delete('/api/tasks/:id', async (request, reply) => {
  const user = await getUserFromHeader(request, reply);
  if (!user) return;

  const { id } = request.params as { id: string };

  // Verify task exists and user owns the project
  const task = await prisma.task.findFirst({
    where: {
      id,
      list: {
        project: {
          ownerId: user.id,
        },
      },
    },
    include: {
      list: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!task) {
    return reply.code(404).send({ error: 'Task not found' });
  }

  await prisma.task.delete({
    where: { id },
  });

  // Emit socket event
  io.to(task.list.projectId).emit('task:deleted', { taskId: id });

  return reply.code(204).send();
});

// POST /api/tasks/:id/move - Move task to new list and order
fastify.post('/api/tasks/:id/move', async (request, reply) => {
  try {
    const user = await getUserFromHeader(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    const body = moveTaskSchema.parse(request.body);

    // Verify task exists and user owns the project
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        list: {
          project: {
            ownerId: user.id,
          },
        },
      },
      include: {
        list: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!existingTask) {
      return reply.code(404).send({ error: 'Task not found' });
    }

    // Verify the new list exists and user owns its project
    const newList = await prisma.list.findFirst({
      where: {
        id: body.listId,
        project: {
          ownerId: user.id,
        },
      },
    });

    if (!newList) {
      return reply.code(404).send({ error: 'Target list not found' });
    }

    // Update the task
    const task = await prisma.task.update({
      where: { id },
      data: {
        listId: body.listId,
        order: body.order,
      },
    });

    // Emit socket event
    io.to(existingTask.list.projectId).emit('task:moved', task);

    return reply.send(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// Start server
const start = async () => {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: 'http://localhost:5173',
      credentials: true,
    });

    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
