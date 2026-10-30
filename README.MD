# vue-rts

## Локальный запуск

Требуется Node **20.19+** или **22.12+**.

```bash
cd vue
npm install
npm run dev
```

Открыть **http://localhost:5173** (адрес покажет Vite).

Доступ по сети: `npm run devhost`. Сборка: `npm run build`, просмотр билда: `npm run preview`.

## Docker

Из корня репозитория:

```bash
docker compose up --build
```

Приложение: **http://localhost:9999**.
