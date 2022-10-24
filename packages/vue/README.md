# @shared-state/vue

This package provides a series of APIs for using Shared State via Vue

## Quick Start

Install `@shared-state/core` and `@shared-state/vue`

```
pnpm install @shared-state/core @shared-state/vue
```

## Example

```vue
<script setup>
import { createSharedState } from "@shared-state/core";
import { useSharedState } from "@shared-state/vue";

const sharedCount = createSharedState(0);
const count = useSharedState(sharedCount);
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>
```
