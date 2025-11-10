import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { List, Task } from '../lib/api';
import { createTask } from '../lib/api';
import TaskCard from './TaskCard';

interface ColumnProps {
  list: List;
  tasks: Task[];
}

export default function Column({ list, tasks }: ColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { setNodeRef } = useDroppable({
    id: list.id,
  });

  const taskIds = tasks.map((task) => task.id);

  const createTaskMutation = useMutation({
    mutationFn: () => createTask(list.id, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', list.id] });
      setTitle('');
      setDescription('');
      setIsAdding(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      createTaskMutation.mutate();
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg p-3 w-72 flex-shrink-0">
      <h3 className="font-semibold text-gray-800 mb-3 px-2">{list.name}</h3>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="min-h-[100px]">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="mt-2 bg-white rounded-lg shadow-sm p-3">
          <input
            type="text"
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <textarea
            placeholder="Description (optional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!title.trim() || createTaskMutation.isPending}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {createTaskMutation.isPending ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setTitle('');
                setDescription('');
              }}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full mt-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="text-lg">+</span> Add task
        </button>
      )}
    </div>
  );
}
