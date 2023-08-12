import { SharedState } from "@shared-state/core";
import { shallowRef, watch, onBeforeMount, onBeforeUnmount } from "vue";

export function useSharedState<T>(sharedState: SharedState<T>) {
  const valueShallowRef = shallowRef<T>(sharedState.get());

  watch(valueShallowRef, (value) => sharedState.set(value));

  const update = () => (valueShallowRef.value = sharedState.get());

  onBeforeMount(() => sharedState.subscribe(update));

  onBeforeUnmount(() => sharedState.unsubscribe(update));

  return valueShallowRef;
}
