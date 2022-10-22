import { ReadOnlySharedState, SharedState } from "@shared-state/core";

export function logger<T>(key: string) {
  return (sharedState: SharedState<T> | ReadOnlySharedState<T>) => {
    sharedState.subscribe((nextState, previousState) => {
      console.log(`[${new Date().toISOString()}] SET ${key}`);
      console.log("previousState", previousState);
      console.log("nextState", nextState);
      console.log("");
    });

    return sharedState;
  };
}
