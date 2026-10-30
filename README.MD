# vue-rts

Прототип браузерной RTS на Vue: как запустить и как у нас устроены координаты на карте.

## Как запустить локально

Нужен Node **20.19+** или **22.12+**.

```bash
cd vue
npm install
npm run dev
```

Vite покажет адрес в консоли, чаще всего **http://localhost:5173**.

## Docker

Из корня репозитория:

```bash
docker compose up --build
```

Приложение откроется на **http://localhost:9999**.

## Игровое поле и координаты

Поле с камерой и сеткой — **http://localhost:5173/game** (`/game`, с главной ссылка «To Game»).

У точки на карте мировые координаты `wx` и `wy`; центр карты — `(0, 0)`. Окно браузера world-координаты не меняет, только проекцию на экран. Камера в Vuex (`camera`): центр viewport в мире — `cameraCenterWx`, `cameraCenterWy`.

**Шебекина** — объект внутри `GameViewport`, обёртка `GameWorldObject`:

```vue
<GameWorldObject :wx="100" :wy="-40">
  <!-- разметка юнита -->
</GameWorldObject>
```

Компоненты и API — из `@/game`.

**Кравченко** — клик в пикселях от левого верхнего угла `.game-viewport` (`offsetX`/`offsetY` или `client` минус `getBoundingClientRect`):

```js
import { useGameMap } from '@/game'

const { screenToWorld } = useGameMap()
const { wx, wy } = screenToWorld(sx, sy)
```

`useGameMap()` вызывай внутри `GameViewport`; снаружи передай ref с `{ width, height }`: `useGameMap(viewportSizeRef)`.
