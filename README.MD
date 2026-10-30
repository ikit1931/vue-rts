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

Поле в **изометрическом** виде (2:1, как в классических RTS) — **http://localhost:5173/game** (`/game`, с главной ссылка «To Game»). Кликни по полю для фокуса. **ЛКМ / СКМ / ПКМ** — тащишь карту, **WASD** — сдвиг обзора по осям мира. Зума нет.

Мировые координаты `(wx, wy)` **не менялись**: центр карты `(0, 0)`, модель Шебекиной по-прежнему оперирует этими числами. Изменилась только **проекция на экран** (`worldToScreen` / `screenToWorld` в `vue/src/game/world/coordinates.js`). Камера в Vuex (`camera`): `cameraCenterWx`, `cameraCenterWy`.

**Шебекина** — те же `(wx, wy)` в данных; отображение через `GameWorldObject` внутри `GameViewport`:

```vue
<GameWorldObject :wx="100" :wy="-40">
  <!-- разметка юнита -->
</GameWorldObject>
```

**Кравченко** — клик в пикселях viewport (левый верх `.game-viewport`), дальше `screenToWorld`:

```js
import { useGameMap } from '@/game'

const { screenToWorld } = useGameMap()
const { wx, wy } = screenToWorld(sx, sy)
```

`useGameMap()` — внутри дерева `GameViewport` или с ref `{ width, height }`.

## Текст для PR (Дегтярев, изометрия v2)

- **Шебекина:** логика и хранение объектов в `(wx, wy)` без изменений; на сцену — `GameWorldObject` + `@/game`.
- **Кравченко:** hit-test по `.game-viewport`, мир через `screenToWorld` / getters `camera/screenToWorld` (сигнатуры те же, учитывается изометрия).
- **Не в scope:** выбор юнита и приказ «иди сюда» — зона Кравченко/Шебекиной после стабилизации клика.
- **Стек:** DOM + SVG-сетка, без Canvas; новых npm-зависимостей нет. Проверка: `npm run build` в `vue/`.
