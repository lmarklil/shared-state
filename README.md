# Shared State

一个简单的原子化共享状态工具，实现参考了 Zustand

## 示例

### 基本用法

```jsx
import { createSharedState } from "shared-state";
import { useSharedState } from "shared-state/react";

const counter = createSharedState(0);

function Counter() {
  const [count, setCount] = useSharedState(counter);

  return (
    <button onClick={() => setCount((count) => count + 1)}>{count}</button>
  );
}
```

### 路由缓存

有时候我们需要在路由下缓存一些状态（如：侧边树打开以及聚焦的选项）

```jsx
import { createSharedStateFamily } from "shared-state";
import { useSharedStateFamily } from "shared-state/react";

const routeCounter = createSharedStateFamily(0);

function Counter() {
  const [count, setCount] = useRouteSharedState(routeCounter);

  return (
    <button onClick={() => setCount((count) => count + 1)}>{count}</button>
  );
}
```

此时在不同的路由下，counter 都是独立

### 在 React 外部操作状态

有时我们需要在 React 外部操作状态（如：在路由拦截器中获取存储在状态中的 token）

```js
import { createSharedState } from "shared-state";

const counter = createSharedState(0);

counter.get(); // 获取状态

counter.set((count) => count + 1); // 更新状态

counter.subscribe(({ previousState, nextState }) =>
  console.log(previousState, nextState)
); // 订阅状态

counter.destroy(); // 销毁状态
```

### 派生状态

TODO

### 中间件

有时我们需要扩展 SharedState 的功能（如：将 SharedState 持久化到 Storage 中），此时可以利用高阶函数的模式扩展 SharedState

```js
import { createSharedState } from "shared-state";

function logger(sharedState) {
  sharedState.subscribe(({ previousState, nextState }) =>
    console.log(previousState, nextState)
  );

  return sharedState;
}

const counter = logger(createSharedState(0));
```

可以用 Lodash 的 flow 函数解决嵌套过深的问题

```js
import { createSharedState } from "shared-state";
import { logger, persist } from "shared-state/middlewares";
import { flow } from "lodash";

const key = "counter";

const createPersistentSharedState = flow(
  createSharedState,
  logger(key),
  debug({ key })
);

const counter = createPersistentSharedState(0);
```

## API

TODO

## TODO

- 支持异步依赖
