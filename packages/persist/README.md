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

const localStoragePersistentState = persist({
  key: "localStorage",
  storage: createWebPersistentStorage(localStorage),
})(createSharedState(0));

const sessionStoragePersistentState = persist({
  key: "sessionStorage",
  storage: createWebPersistentStorage(sessionStorage),
})(createSharedState(0));
```

### 监听持久化数据加载状态

```js
import { createSharedState } from "@shared-state/core";
import { persist, createWebPersistentStorage } from "@shared-state/persist";

const hydrationState = createSharedState(true);

const persistentState = persist({
  key: "localStorage",
  storage: createWebPersistentStorage(localStorage),
  onHydrationBegin: () => hydrationState.set(true),
  onHydrationFinish: () => hydrationState.set(false),
})(createSharedState(0));
```
