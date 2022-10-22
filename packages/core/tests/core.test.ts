import { createDerivedSharedState, createSharedState } from "../src";

test("SharedState set and get", () => {
  const counter = createSharedState(0);

  counter.set((count) => count + 1);

  expect(counter.get()).toBe(1);
});

test("DerivedSharedState", () => {
  const counter = createSharedState(0);

  const doubleCounter = createDerivedSharedState((get) => get(counter) * 2);

  counter.set((count) => count + 1);

  expect(doubleCounter.get()).toBe(2);
});