import { ReactNode, createContext, createElement, useContext } from "react";
import { SharedState } from "@shared-state/core";
import {
  useSetSharedState,
  useSharedState,
  useSharedStateValue,
} from "./hooks";

export function createScopedSharedState<T>() {
  const SharedStateContext = createContext<SharedState<T> | null>(null);

  function Provider(props: {
    sharedState: SharedState<T>;
    children: ReactNode;
  }) {
    const { sharedState, children } = props;

    return createElement(
      SharedStateContext.Provider,
      {
        value: sharedState,
      },
      children
    );
  }

  function useStore() {
    const sharedState = useContext(SharedStateContext);

    if (!sharedState)
      throw new Error("Missing SharedStateContext.Provider in the tree");

    return sharedState;
  }

  function useStateValue() {
    const store = useStore();

    return useSharedStateValue(store);
  }

  function useSetState() {
    const store = useStore();

    return useSetSharedState(store);
  }

  function useState() {
    const store = useStore();

    return useSharedState(store);
  }

  return { Provider, useStore, useStateValue, useSetState, useState };
}
