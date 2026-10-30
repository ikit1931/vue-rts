# vue-rts

Прототип браузерной RTS на Vue. Ниже — запуск и договорённости по карте для тех, кто к ней подключается.

## Как запустить локально

Нужен Node **20.19+** или **22.12+**.

```bash
cd vue
npm install
npm run dev
```

Vite напишет адрес в консоли, обычно **http://localhost:5173**.

## Docker

Из корня репозитория:

```bash
docker compose up --build
```

Сервис будет на **http://localhost:9999**.

## Игра и координаты

Поле смотри на **http://localhost:5173/game** — изометрия 2:1 (сетка по диагонали, как в [changelab1](https://github.com/Anastasia2e/vue-rts/tree/changelab1)). Кликни по полю для фокуса: **ЛКМ / СКМ / ПКМ** тащат карту, **WASD** сдвигают обзор, **колёсико** — зум.


*Шебекина* ставит юнита так:

```vue
<GameWorldObject :wx="100" :wy="-40">
  <!-- разметка -->
</GameWorldObject>
```

Компоненты бери из `@/game`, внутри `GameViewport`.

*Кравченко* переводит клик в мир: пиксели от левого верхнего угла `.game-viewport`, затем `screenToWorld` из `useGameMap()` (внутри `GameViewport` или со своим ref размера viewport).

```js
import { useGameMap } from '@/game'

const { screenToWorld } = useGameMap()
const { wx, wy } = screenToWorld(sx, sy)
```

Сборка: `npm run build` в `vue/`. Canvas и новых npm-пакетов нет.
