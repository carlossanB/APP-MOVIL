import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ITask } from '../../domain/models/ITask';

// ── Axios Instance ──────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: 'https://dummyjson.com',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — could inject auth token here
api.interceptors.request.use(
  config => config,
  error => Promise.reject(error),
);

// Response interceptor — normalize errors
api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    const networkError = !error.response;
    if (networkError) {
      return Promise.reject(new Error('NO_NETWORK'));
    }
    return Promise.reject(error);
  },
);

// ── DTOs ────────────────────────────────────────────────────────────────────
interface RemoteTodoDto {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}

function dtoToITask(dto: RemoteTodoDto): ITask {
  const now = Date.now();
  return {
    id: String(dto.id),
    title: dto.todo,
    completed: dto.completed,
    userId: dto.userId,
    createdAt: now,
    updatedAt: now,
    pendingSync: false,
    localOnly: false,
  };
}

const SPANISH_TASKS = [
  "Hacer algo amable por alguien", "Memorizar un poema", "Ver una película clásica",
  "Ver un documental", "Invertir en criptomonedas", "Contribuir a open source",
  "Resolver un cubo de Rubik", "Hornear pan para los vecinos", "Ir a ver una obra",
  "Planificar unas vacaciones", "Aprender a tocar la guitarra", "Leer un libro",
  "Hacer ejercicio por 30 minutos", "Preparar la cena", "Limpiar mi habitación",
  "Estudiar para el examen", "Llamar a mis padres", "Actualizar mi currículum",
  "Organizar el escritorio", "Hacer compras del supermercado", "Pasear al perro",
  "Meditar por 10 minutos", "Aprender una nueva receta", "Escribir en el diario",
  "Dormir al menos 8 horas", "Revisar correos importantes", "Beber agua",
  "Aprender React Native", "Traducir la aplicación al español", "Subir cambios a GitHub",
  "Arreglar error en la base de datos", "Practicar inglés", "Escuchar un podcast",
  "Comprar comida para el perro", "Pagar las facturas de luz e internet"
];

let mockDb: RemoteTodoDto[] = Array.from({ length: 150 }).map((_, i) => {
  const t = SPANISH_TASKS[i % SPANISH_TASKS.length];
  return {
    id: i + 1,
    todo: t,
    completed: i % 3 === 0,
    userId: (i % 5) + 1,
  };
});

// Simulate latency
const delay = (ms: number) => new Promise<void>(res => setTimeout(() => res(), ms));

// ── Remote DataSource ────────────────────────────────────────────────────────
export const RemoteDataSource = {
  async fetchAll(limit = 150): Promise<ITask[]> {
    await delay(600);
    return mockDb.map(dtoToITask);
  },

  async fetchById(id: string): Promise<ITask> {
    await delay(300);
    const item = mockDb.find(d => String(d.id) === id);
    if (!item) throw new Error('Not found');
    return dtoToITask(item);
  },

  async create(title: string, userId: number): Promise<ITask> {
    await delay(500);
    const newItem = {
      id: Date.now(),
      todo: title,
      completed: false,
      userId,
    };
    mockDb.push(newItem);
    return dtoToITask(newItem);
  },

  async update(id: string, payload: { title?: string; completed?: boolean }): Promise<ITask> {
    await delay(500);
    const index = mockDb.findIndex(d => String(d.id) === id);
    if (index === -1) throw new Error('Not found');
    
    if (payload.title !== undefined) mockDb[index].todo = payload.title;
    if (payload.completed !== undefined) mockDb[index].completed = payload.completed;
    
    return dtoToITask(mockDb[index]);
  },

  async delete(id: string): Promise<void> {
    await delay(400);
    mockDb = mockDb.filter(d => String(d.id) !== id);
  },
};
