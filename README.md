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