# @shared-state/persistence

此软件包提供状态持久化功能

## 快速开始

Install `@shared-state/core` and `@shared-state/persistence`

```
pnpm install @shared-state/core @shared-state/persistence
```

## 示例

### 使用 localStorage 或 sessionStorage 持久化状态

```js
import {
  createPersistentSharedState,
  createWebPersistentStorage,
} from "@shared-state/persistence";

const localStoragePersistentState = createPersistentSharedState(
  createWebPersistentStorage(localStorage),
  "localStorage",
  0
);

const sessionStoragePersistentState = createPersistentSharedState(
  createWebPersistentStorage(sessionStorage),
  "sessionStorage",
  0
);
```

### 监听持久化数据加载状态

```js
import { createSharedState } from "@shared-state/core";
import { persist, createWebPersistentStorage } from "@shared-state/persistence";

const persistentState = createPersistentSharedState(
  createWebPersistentStorage(localStorage),
  "localStorage",
  0
);

persistentState.hydrationState.subscribe((hydrating) => console.log(hydrating));
```
