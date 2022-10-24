import { SharedState } from "@shared-state/core";
import { shallowRef, watch, onBeforeMount, onBeforeUnmount } from "vue";

export function useSharedState<T>(sharedState: SharedState<T>) {
  const valueShallowRef = shallowRef<T>(sharedState.get());

  watch(valueShallowRef, (value) => sharedState.set(value));

  let unbsubscribe: () => void;

  onBeforeMount(
    () =>
      (unbsubscribe = sharedState.subscribe(
        (nextValue) => (valueShallowRef.value = nextValue)
      ))
  );

  onBeforeUnmount(() => unbsubscribe());

  return valueShallowRef;
}
