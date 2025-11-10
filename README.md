# Task Management App

A modern, real-time task management application with drag-and-drop functionality, built with a full-stack TypeScript architecture.

![Task Board](./screenshots/board.png)
*Main board view with drag-and-drop tasks*

## Features

- 📋 **Kanban-style boards** - Organize tasks into customizable lists
- 🎯 **Drag & Drop** - Seamlessly move tasks between lists
- ⚡ **Real-time updates** - See changes instantly with Socket.IO
- 🎨 **Beautiful UI** - Modern interface with Tailwind CSS
- 💾 **Auto-save** - Persistent state with localStorage
- 🔔 **Toast notifications** - User-friendly feedback
- 📱 **Responsive design** - Works on all devices
- 🌙 **Loading states** - Smooth skeleton loaders

## Tech Stack

### Backend
- **Fastify** - Fast and low overhead web framework
- **Prisma** - Next-generation ORM
- **SQLite** - Lightweight database
- **Socket.IO** - Real-time bidirectional communication
- **Zod** - TypeScript-first schema validation

### Frontend
- **React 19** - UI library
- **Vite** - Next generation frontend tooling
- **TailwindCSS** - Utility-first CSS framework
- **@dnd-kit** - Modern drag-and-drop toolkit
- **TanStack Query** - Powerful data synchronization
- **Sonner** - Toast notifications
- **Socket.IO Client** - Real-time updates

## Prerequisites

- Node.js 18+ and npm
- Git

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd "Task Management App"
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with demo data (optional)
npm run prisma:seed

# Start the development server (runs on :3000)
npm run dev
```

The backend server will start at `http://localhost:3000`

### 3. Frontend Setup

Open a new terminal:

```bash
cd web

# Install dependencies
npm install

# Start the development server (runs on :5173)
npm run dev
```

The frontend will start at `http://localhost:5173`

## API Endpoints

### Users
- `GET /api/me` - Get or create user from x-username header
- `POST /api/users` - Create a new user
- `GET /api/users/me` - Get current user

### Projects
- `GET /api/projects` - Get all projects for current user
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get a specific project
- `GET /api/projects/:id/board` - Get full board with lists and tasks

### Lists
- `GET /api/lists/:projectId` - Get all lists for a project
- `POST /api/lists` - Create a new list

### Tasks
- `GET /api/tasks/:listId` - Get all tasks for a list
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/:id` - Update task title/description
- `POST /api/tasks/:id/move` - Move task to new list/order
- `DELETE /api/tasks/:id` - Delete a task

All endpoints require the `x-username` header (automatically set by the frontend).

## Project Structure

```
Task Management App/
├── server/                 # Backend application
│   ├── prisma/            # Database schema and migrations
│   │   ├── schema.prisma  # Prisma schema
│   │   ├── seed.ts        # Database seeding
│   │   └── migrations/    # Database migrations
│   ├── src/
│   │   └── index.ts       # Main server file
│   ├── package.json
│   └── tsconfig.json
│
├── web/                   # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Board.tsx      # Main board component
│   │   │   ├── Column.tsx     # List column component
│   │   │   └── TaskCard.tsx   # Task card component
│   │   ├── lib/
│   │   │   └── api.ts     # API client
│   │   ├── store/
│   │   │   └── socket.ts  # Socket.IO setup
│   │   ├── App.tsx        # Root component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
│
└── README.md              # This file
```

## Development

### Backend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database with demo data
```

### Frontend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Features in Detail

### Real-time Collaboration
Socket.IO enables instant updates across all connected clients. When a user creates, updates, moves, or deletes a task, all other users see the change immediately.

### Drag & Drop
Built with @dnd-kit, the drag-and-drop system is:
- Smooth and performant
- Accessible (keyboard navigation)
- Mobile-friendly (touch support)

### Data Persistence
- **Backend**: All data stored in SQLite via Prisma
- **Frontend**: User preferences and scroll position saved in localStorage
- **Auto-save**: Changes saved immediately on every action

### UX Enhancements
- **Loading skeletons**: Smooth loading states while data fetches
- **Empty states**: Helpful messages when lists are empty
- **Toast notifications**: Success/error feedback for all actions
- **Scroll persistence**: Board scroll position saved per project

## Screenshots

### Task Board
![Task Board](./screenshots/board.png)
*Main board view with multiple lists*

### Creating a Task
![Creating Task](./screenshots/create-task.png)
*Task creation form with title and description*

### Drag and Drop
![Drag and Drop](./screenshots/drag-drop.png)
*Moving tasks between lists*

### Empty State
![Empty State](./screenshots/empty-state.png)
*Helpful empty state when no tasks exist*

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Acknowledgments

- Built with ❤️ using modern web technologies
- Icons and emojis for visual appeal
- Inspired by popular task management tools like Trello and Linear
