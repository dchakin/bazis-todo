# Заметки с задачами

Небольшое SPA на Nuxt 4, Vue 3, TypeScript и Pinia. Можно создавать заметки,
добавлять задачи, отмечать их выполнение, отменять и повторять изменения.

Сохранённые заметки находятся в `localStorage`, черновики — в `sessionStorage`
текущей вкладки. После перезагрузки приложение предлагает восстановить черновик.
Backend и регистрация не нужны; данные не синхронизируются между устройствами.

## Запуск через Docker

Нужны Docker и Docker Compose.

```bash
git clone https://github.com/dchakin/bazis-todo.git
cd bazis-todo
docker-compose up
```

Приложение доступно по адресу [http://localhost:3000](http://localhost:3000).
В новых установках Compose можно использовать `docker compose up`.
Остановка и удаление контейнера: `docker-compose down`.

## Локальная разработка

Нужны Node.js 24 LTS (см. `.nvmrc`) и npm.

```bash
npm ci
npm run dev
```

По умолчанию приложение открывается на [http://localhost:3000](http://localhost:3000).
Если Docker-контейнер уже запущен, остановите его, чтобы освободить порт.

## Проверки

```bash
npm test
npm run typecheck
npm run format:check
npm run build
```

Unit-тесты на Vitest проверяют историю изменений, стор, хранение заметок и черновики.
