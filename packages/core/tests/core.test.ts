import { createDerivedSharedState, createSharedState } from "../src";

test("SharedState set and get", () => {
  const count = createSharedState(0);

  count.set((count) => count + 1);

  expect(count.get()).toBe(1);
});

test("DerivedSharedState", () => {
  const count = createSharedState(0);

  const doubleCount = createDerivedSharedState((get) => get(count) * 2);

  count.set((count) => count + 1);

  expect(doubleCount.get()).toBe(2);
});

test("ConditionalDerivedSharedState", () => {
  const count = createSharedState(0);

  const smallMessage = createSharedState("small");

  const bigMessage = createSharedState("big");

  const result = createDerivedSharedState((get) => {
    return get(count) > 100 ? get(bigMessage) : get(smallMessage);
  });

  expect(result.get()).toBe("small");

  count.set(200);

  expect(result.get()).toBe("big");

  bigMessage.set("big message");

  expect(result.get()).toBe("big message");
});
