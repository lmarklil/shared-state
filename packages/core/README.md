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

const CountState = createSharedState(0);

CountState.get(); // Get value

CountState.set((count) => count + 1); // Set value

const onSharedStateChange = ({ previousState, nextState }) =>
  console.log(previousState, nextState)

CountState.subscribe(onSharedStateChange); // Subscribe state

CountState.unsubscribe(onSharedStateChange)
```