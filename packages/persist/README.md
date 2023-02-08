# @shared-state/persist

此软件包提供状态持久化功能

## 快速开始

Install `@shared-state/core` and `@shared-state/persist`

```
pnpm install @shared-state/core @shared-state/persist
```

## 示例

### 使用 localStorage 或 sessionStorage 持久化状态

```js
import { createSharedState } from "@shared-state/core";
import { persist, createWebPersistentStorage } from "@shared-state/persist";

const localStoragePersistentState = persist(createSharedState(0), {
  key: "localStorage",
  storage: createWebPersistentStorage(localStorage),
});

const sessionStoragePersistentState = persist(createSharedState(0), {
  key: "sessionStorage",
  storage: createWebPersistentStorage(sessionStorage),
});
```

### 监听持久化数据加载状态

```js
import { createSharedState } from "@shared-state/core";
import { persist, createWebPersistentStorage } from "@shared-state/persist";

const persistentState = persist(createSharedState(0), {
  key: "localStorage",
  storage: createWebPersistentStorage(localStorage),
});

persistentState.hydrationState.subscribe((hydrating) => console.log(hydrating));
```
