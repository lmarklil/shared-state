# @shared-state/core

The core package of `@shared-state`

## Quick Start

Install `@shared-state/core`

```
pnpm install @shared-state/core
```

## Example

### Basic

```js
import { createSharedState } from "@shared-state/core";

const sharedCount = createSharedState(0);

sharedCount.get(); // Get value

sharedCount.set((count) => count + 1); // Set value

sharedCount.subscribe(({ previousState, nextState }) =>
  console.log(previousState, nextState)
); // Subscribe state

sharedCount.destroy(); // Destroy state
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

### Async derived state

```js
import {
  createSharedState,
  createAsyncDerivedSharedState,
} from "@shared-state/core";

const userId = createSharedState(null);

const userInfo = createAsyncDerivedSharedState(async (get) => {
  const id = get(userId);

  if (!id) return null;

  return await getUserInfo(id);
});
```
