import { useEffect, useState } from 'react';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import type {
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  fetchProjects,
  fetchLists,
  fetchTasks,
  updateTask,
} from '../lib/api';
import type { Project, List, Task } from '../lib/api';
import { getSocket } from '../store/socket';
import Column from './Column';
import TaskCard from './TaskCard';

export default function Board() {
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch the first project
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const project: Project | undefined = projects?.[0];

  // Fetch lists for the project
  const { data: lists = [] } = useQuery({
    queryKey: ['lists', project?.id],
    queryFn: () => fetchLists(project!.id),
    enabled: !!project,
  });

  // Fetch tasks for all lists
  const tasksQueries = useQueries({
    queries: lists.map((list) => ({
      queryKey: ['tasks', list.id],
      queryFn: () => fetchTasks(list.id),
    })),
  });

  const allTasks: Task[] = tasksQueries.flatMap((q) => q.data || []);

  // Socket subscription
  useEffect(() => {
    if (!project) return;

    const socket = getSocket();

    socket.emit('join', project.id);

    socket.on('task:moved', (data: Task) => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    socket.on('task:updated', (data: Task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });

    return () => {
      socket.off('task:moved');
      socket.off('task:updated');
      socket.emit('leave', project.id);
    };
  }, [project, queryClient]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = allTasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetListId = over.id as string;

    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return;

    // If dropped in the same list at the same position, do nothing
    if (task.listId === targetListId) return;

    // Optimistic update
    const targetList = lists.find((l) => l.id === targetListId);
    if (!targetList) return;

    const targetTasks = allTasks.filter((t) => t.listId === targetListId);
    const newPosition = targetTasks.length;

    // Update the query cache optimistically
    queryClient.setQueryData(['tasks', task.listId], (old: Task[] = []) =>
      old.filter((t) => t.id !== taskId)
    );

    queryClient.setQueryData(['tasks', targetListId], (old: Task[] = []) => [
      ...old,
      { ...task, listId: targetListId, position: newPosition },
    ]);

    try {
      // Make API call
      await updateTask(taskId, { listId: targetListId, order: newPosition });
    } catch (error) {
      console.error('Failed to move task:', error);
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white text-lg">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{project.name}</h1>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {lists.map((list) => {
            const tasks = allTasks.filter((t) => t.listId === list.id);
            return <Column key={list.id} list={list} tasks={tasks} />;
          })}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
