import { SharedState } from "@shared-state/core";

export function logger<T>(sharedState: SharedState<T>, key: string) {
  sharedState.subscribe((nextState, previousState) => {
    console.log(`[${new Date().toISOString()}] SET ${key}`);
    console.log("previousState", previousState);
    console.log("nextState", nextState);
    console.log("");
  });

  return sharedState;
}
