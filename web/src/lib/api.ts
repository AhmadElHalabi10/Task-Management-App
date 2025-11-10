import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const username = localStorage.getItem('username');
  if (username) {
    config.headers['x-username'] = username;
  }
  return config;
});

export default api;

export interface Project {
  id: string;
  name: string;
}

export interface List {
  id: string;
  projectId: string;
  name: string;
  position: number;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description?: string;
  position: number;
}

export const fetchProjects = async (): Promise<Project[]> => {
  const response = await api.get('/projects');
  return response.data;
};

export const fetchLists = async (projectId: string): Promise<List[]> => {
  const response = await api.get(`/lists/${projectId}`);
  return response.data;
};

export const fetchTasks = async (listId: string): Promise<Task[]> => {
  const response = await api.get(`/tasks/${listId}`);
  return response.data;
};

export const createTask = async (
  listId: string,
  title: string,
  description?: string
): Promise<Task> => {
  const response = await api.post('/tasks', {
    listId,
    title,
    description,
  });
  return response.data;
};

export const updateTask = async (
  taskId: string,
  data: { listId?: string; title?: string; description?: string; order?: number }
): Promise<Task> => {
  const response = await api.patch(`/tasks/${taskId}`, data);
  return response.data;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}`);
};
