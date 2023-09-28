import { createSharedState } from "../src";

test("SharedState set and get", () => {
  const count = createSharedState(0);

  count.set((count) => count + 1);

  expect(count.get()).toBe(1);
});
