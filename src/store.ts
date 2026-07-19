import { createRequire } from "node:module";
import type { RedisLike } from "./toolkit/session/redis.js";

export interface UserAccount {
  telegram_id: number;
  default_difficulty: string;
  quiz_count: number;
}

export interface StudyNote {
  topic: string;
  content: string;
  timestamp: string;
}

export interface QuizConfig {
  topic: string;
  difficulty: string;
  count: number;
}

export interface Store {
  getUser(telegramId: number): Promise<UserAccount | null>;
  setUser(user: UserAccount): Promise<void>;
  getNotes(telegramId: number): Promise<StudyNote[]>;
  addNote(telegramId: number, note: StudyNote): Promise<void>;
  deleteNote(telegramId: number, topic: string): Promise<boolean>;
  getQuiz(telegramId: number, topic: string): Promise<QuizConfig | null>;
  setQuiz(telegramId: number, quiz: QuizConfig): Promise<void>;
}

class MemoryStore implements Store {
  private users = new Map<number, UserAccount>();
  private notes = new Map<number, StudyNote[]>();
  private quizzes = new Map<string, QuizConfig>();

  private noteKey(uid: number, topic: string) {
    return `${uid}:${topic}`;
  }

  async getUser(telegramId: number) {
    return this.users.get(telegramId) ?? null;
  }
  async setUser(user: UserAccount) {
    this.users.set(user.telegram_id, user);
  }
  async getNotes(telegramId: number) {
    return this.notes.get(telegramId) ?? [];
  }
  async addNote(telegramId: number, note: StudyNote) {
    const list = this.notes.get(telegramId) ?? [];
    const idx = list.findIndex((n) => n.topic === note.topic);
    if (idx >= 0) list[idx] = note;
    else list.push(note);
    this.notes.set(telegramId, list);
  }
  async deleteNote(telegramId: number, topic: string) {
    const list = this.notes.get(telegramId) ?? [];
    const idx = list.findIndex((n) => n.topic === topic);
    if (idx < 0) return false;
    list.splice(idx, 1);
    this.notes.set(telegramId, list);
    return true;
  }
  async getQuiz(telegramId: number, topic: string) {
    return this.quizzes.get(this.noteKey(telegramId, topic)) ?? null;
  }
  async setQuiz(telegramId: number, quiz: QuizConfig) {
    this.quizzes.set(this.noteKey(telegramId, quiz.topic), quiz);
  }
}

class RedisStore implements Store {
  constructor(private client: RedisLike) {}

  private async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private async set(key: string, value: unknown): Promise<void> {
    await this.client.set(key, JSON.stringify(value));
  }

  async getUser(telegramId: number) {
    return this.get<UserAccount>(`user:${telegramId}`);
  }
  async setUser(user: UserAccount) {
    await this.set(`user:${user.telegram_id}`, user);
  }
  async getNotes(telegramId: number) {
    return (await this.get<StudyNote[]>(`notes:${telegramId}`)) ?? [];
  }
  async addNote(telegramId: number, note: StudyNote) {
    const list = await this.getNotes(telegramId);
    const idx = list.findIndex((n) => n.topic === note.topic);
    if (idx >= 0) list[idx] = note;
    else list.push(note);
    await this.set(`notes:${telegramId}`, list);
  }
  async deleteNote(telegramId: number, topic: string) {
    const list = await this.getNotes(telegramId);
    const idx = list.findIndex((n) => n.topic === topic);
    if (idx < 0) return false;
    list.splice(idx, 1);
    await this.set(`notes:${telegramId}`, list);
    return true;
  }
  async getQuiz(telegramId: number, topic: string) {
    return this.get<QuizConfig>(`quiz:${telegramId}:${topic}`);
  }
  async setQuiz(telegramId: number, quiz: QuizConfig) {
    await this.set(`quiz:${telegramId}:${quiz.topic}`, quiz);
  }
}

let _instance: Store | null = null;

export function getStore(): Store {
  if (_instance) return _instance;
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const require = createRequire(import.meta.url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ioredis: any = require("ioredis");
    const Redis = ioredis.default ?? ioredis.Redis ?? ioredis;
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: false,
    });
    _instance = new RedisStore(client as RedisLike);
  } else {
    _instance = new MemoryStore();
  }
  return _instance;
}
