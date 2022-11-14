# Shared State

一个简单的原子化共享状态工具，实现参考了 Zustand

## 安装

```
pnpm install @shared-state/core
```

## 快速开始

### 基本操作

```js
import { createSharedState } from "@shared-state/core";

const counter = createSharedState(0);

counter.get(); // 获取状态

counter.set((count) => count + 1); // 更新状态

counter.subscribe(({ previousState, nextState }) =>
  console.log(previousState, nextState)
); // 订阅状态

counter.destroy(); // 销毁状态
```

### 在 React 函数组件中使用

```jsx
import { createSharedState } from "@shared-state/core";
import { useSharedState } from "@shared-state/react";

const sharedCount = createSharedState(0);

function Counter() {
  const [count, setCount] = useSharedState(sharedCount);

  return (
    <button onClick={() => setCount((count) => count + 1)}>{count}</button>
  );
}
```

### 在 React 类组件中使用

```jsx
import { Component } from "react";
import { createSharedState } from "@shared-state/core";
import { connectSharedState } from "@shared-state/react";

const sharedCount = createSharedState(0);

@connectSharedState((get) => ({
  count: get(sharedCounter),
}))
class Counter extends Component {
  render() {
    return (
      <button onClick={() => sharedCount.set((count) => count + 1)}>
        {this.props.count}
      </button>
    );
  }
}
```

### 派生状态

在 SharedState 中，一个状态可以由另一个状态派生而来，且这个派生状态会随着原始状态的更新而更新

```js
import {
  createSharedState,
  createDerivedSharedState,
} from "@shared-state/core";

const sharedCount = createSharedState(0);

const sharedDoubleCount = createDerivedSharedState(
  (get) => get(sharedCount) * 2
);

console.log(sharedCount.get(), sharedDoubleCount.get()); // count:0, doubleCount:0

sharedCount.set((count) => count + 1);

console.log(sharedCount.get(), sharedDoubleCount.get()); // count:1, doubleCount:2
```

### 中间件

有时我们需要扩展 SharedState 的功能（如：将 SharedState 持久化到 Storage 中），此时可以利用高阶函数的模式扩展 SharedState

```js
import { createSharedState } from "@shared-state/core";

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
import { createSharedState } from "@shared-state/core";
import { logger, persist } from "@shared-state/middlewares";
import { flow } from "lodash";

const key = "counter";

const createPersistentSharedState = flow(
  createSharedState,
  logger(key),
  persist({ key })
);

const counter = createPersistentSharedState(0);
```

## API

TODO