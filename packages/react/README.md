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

const CounterState = createSharedState(0);

function Counter() {
  const [count, setCount] = useSharedState(CounterState);

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

const CounterState = createSharedState(0);

@connectSharedState((get) => ({
  count: get(CounterState),
  setCount: CounterState.set,
}))
class Counter extends React.Component {
  render() {
    return (
      <button onClick={() => this.props.setCount((count) => count + 1)}>
        {this.props.count}
      </button>
    );
  }
}
```

### Optimizing Function Component through selector

```jsx
import { createSharedState } from "@shared-state/core";
import { useSharedStateValue, useSetSharedState } from "@shared-state/react";

const UserState = createSharedState({ name: "Mark", age: 25 });

// This component will only re-render when the user.name changes.
function UserName() {
  const name = useSharedStateValue(UserState, (user) => user.name);
  const setUser = useSetSharedState();

  return (
    <div>
      Name:
      <input
        value={name}
        onChange={(event) =>
          setUser((user) => ({
            ...user,
            name: event.target.value,
          }))
        }
      />
    </div>
  );
}

// This component will only re-render when the user.age changes.
function UserAge() {
  const age = useSharedStateValue(UserState, (user) => user.age);
  const setUser = useSetSharedState();

  return (
    <div>
      Age:
      <input
        value={age}
        onChange={(event) =>
          setUser((user) => ({
            ...user,
            age: event.target.value,
          }))
        }
      />
    </div>
  );
}

// This component will re-render when the user changes.
function UserDescription() {
  const user = useSharedState(UserState);

  return (
    <div>
      {user.name} was {user.age} years old.
    </div>
  );
}

function UserInfo() {
  return (
    <>
      <UserName />
      <UserAge />
      <UserDescription />
    </>
  );
}
```
