# @shared-state/react

This package provides a series of APIs for using Shared State via React

## Quick Start

Install `@shared-state/core` and `@shared-state/react`

```
pnpm install @shared-state/core @shared-state/react
```

## Example

### Using with Function Component

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

### Using with Class Component

```jsx
import { Component } from "react";
import { createSharedState } from "@shared-state/core";
import { connectSharedState } from "@shared-state/react";

const sharedCount = createSharedState(0);

@connectSharedState((get) => ({
  count: get(sharedCount),
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
