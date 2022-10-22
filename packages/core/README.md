# @shared-state/core

The core package of `@shared-state`

## Quick Start

Install `@shared-state/core`

```
pnpm install @shared-state/core
```

## Example

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
