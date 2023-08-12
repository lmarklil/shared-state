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

const SharedCount = createSharedState(0);

function Counter() {
  const [count, setCount] = useSharedState(SharedCount);

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

const SharedCount = createSharedState(0);

@connectSharedState((get) => ({
  count: get(SharedCount),
}))
class Counter extends Component {
  render() {
    return (
      <button onClick={() => SharedCount.set((count) => count + 1)}>
        {this.props.count}
      </button>
    );
  }
}
```

### Scoped shared state

```jsx
import { useRef } from "react";
import { createSharedState } from "@shared-state/core";
import { createScopedSharedState } from "@shared-state/react";

const ScopedSharedState = createScopedSharedState();

function Count() {
  const count = ScopedSharedState.useState();

  return <span>{count}</span>;
}

function IncreaseButton() {
  const setCount = ScopedSharedState.useSetState();

  return <button onClick={() => setCount((count) => count + 1)}>+</button>;
}

function ScopedCounter(props) {
  const { initialValue } = props;

  const sharedStateRef = useRef();

  if (!sharedStateRef.current) {
    sharedStateRef.current = createSharedState(initialValue);
  }

  return (
    <ScopedSharedState.Provider sharedState={sharedState}>
      <div>
        <Count />
        <IncreaseButton />
      </div>
    </ScopedSharedState.Provider>
  );
}

function App() {
  return (
    <>
      <ScopedCounter initialValue={1} />
      <ScopedCounter initialValue={10} />
    </>
  );
}
```
