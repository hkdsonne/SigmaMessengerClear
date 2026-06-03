import '@testing-library/jest-dom/vitest';
import { server } from './mocks/server';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';

// Запускаем MSW сервер перед всеми тестами
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(); // сбрасываем обработчики после каждого теста
  cleanup();              // очистка React-рендеров
});
afterAll(() => server.close());