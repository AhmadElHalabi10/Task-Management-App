# Task Management Server

A Fastify + TypeScript server with Socket.IO, Prisma, and Zod validation for a task management application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Generate Prisma Client:
```bash
npm run prisma:generate
```

3. Create and migrate database:
```bash
npm run prisma:migrate
```

4. Seed the database with demo data:
```bash
npm run prisma:seed
```

## Development

Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Production

Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users/me` - Get current user (requires `x-username` header)

### Projects
- `POST /api/projects` - Create a new project
- `GET /api/projects` - Get all projects for current user
- `GET /api/projects/:id` - Get a specific project

### Lists
- `POST /api/lists` - Create a new list
- `GET /api/lists/:projectId` - Get all lists for a project

### Tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:listId` - Get all tasks for a list
- `PATCH /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

## Socket.IO Events

### Client to Server
- `join:project` - Join a project room
- `leave:project` - Leave a project room
- `task:create` - Create a task (broadcasts to room)
- `task:update` - Update a task (broadcasts to room)
- `task:delete` - Delete a task (broadcasts to room)
- `task:move` - Move a task between lists (broadcasts to room)

### Server to Client
- `task:created` - Task was created
- `task:updated` - Task was updated
- `task:deleted` - Task was deleted
- `task:moved` - Task was moved

## Database

SQLite database located at `prisma/dev.db`

### Models
- User
- Project
- List
- Task
