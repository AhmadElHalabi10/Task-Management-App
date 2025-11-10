import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
    },
  });

  console.log('Created user:', demoUser);

  // Create Demo Board project
  const demoProject = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      name: 'Demo Board',
      ownerId: demoUser.id,
    },
  });

  console.log('Created project:', demoProject);

  // Create three lists: Todo, Doing, Done
  const todoList = await prisma.list.upsert({
    where: { id: 'list-todo' },
    update: {},
    create: {
      id: 'list-todo',
      name: 'Todo',
      order: 0,
      projectId: demoProject.id,
    },
  });

  const doingList = await prisma.list.upsert({
    where: { id: 'list-doing' },
    update: {},
    create: {
      id: 'list-doing',
      name: 'Doing',
      order: 1,
      projectId: demoProject.id,
    },
  });

  const doneList = await prisma.list.upsert({
    where: { id: 'list-done' },
    update: {},
    create: {
      id: 'list-done',
      name: 'Done',
      order: 2,
      projectId: demoProject.id,
    },
  });

  console.log('Created lists:', { todoList, doingList, doneList });

  // Create sample tasks
  const tasks = [
    {
      id: 'task-1',
      title: 'Set up project structure',
      description: 'Initialize the project with necessary folders and files',
      listId: doneList.id,
      order: 0,
      createdById: demoUser.id,
    },
    {
      id: 'task-2',
      title: 'Design database schema',
      description: 'Create Prisma schema with all required models',
      listId: doneList.id,
      order: 1,
      createdById: demoUser.id,
    },
    {
      id: 'task-3',
      title: 'Implement REST API endpoints',
      description: 'Build all CRUD endpoints for users, projects, lists, and tasks',
      listId: doingList.id,
      order: 0,
      createdById: demoUser.id,
    },
    {
      id: 'task-4',
      title: 'Add Socket.IO integration',
      description: 'Implement real-time updates for task changes',
      listId: doingList.id,
      order: 1,
      createdById: demoUser.id,
    },
    {
      id: 'task-5',
      title: 'Build frontend UI',
      description: 'Create React components for the task board',
      listId: todoList.id,
      order: 0,
      createdById: demoUser.id,
    },
    {
      id: 'task-6',
      title: 'Add drag and drop functionality',
      description: 'Implement drag and drop for moving tasks between lists',
      listId: todoList.id,
      order: 1,
      createdById: demoUser.id,
    },
    {
      id: 'task-7',
      title: 'Write tests',
      description: 'Add unit and integration tests for API endpoints',
      listId: todoList.id,
      order: 2,
      createdById: demoUser.id,
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    });
  }

  console.log('Created tasks:', tasks.length);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
