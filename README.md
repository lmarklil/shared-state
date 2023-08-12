# Shared State

A shared state library for JavaScript

## Installation

```
pnpm install @shared-state/core
```

## Quick Start

### Basic

```js
import { createSharedState } from "@shared-state/core";

const counter = createSharedState(0);

counter.get(); // Get state

counter.set((count) => count + 1); // Update state

counter.subscribe(({ previousState, nextState }) =>
  console.log(previousState, nextState)
); // Subscribe state
```

### Derived state

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

### Using with React function component

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

### Using with React class component

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
