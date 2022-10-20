import {
  SharedState,
  SharedStateFamily,
  Partial,
  NextStateGetter,
  SharedStateFamilyMemberKey,
} from "./types";

export function getPartialValue<T>(previousValue: T, partial: Partial<T>) {
  return typeof partial === "function"
    ? (partial as NextStateGetter<T>)(previousValue)
    : partial;
}

export function getSharedStateFamilyMember<T>(
  sharedStateFamily: SharedStateFamily<T>,
  key: SharedStateFamilyMemberKey
): SharedState<T> {
  return {
    get: () => sharedStateFamily.get(key),
    set: (partial) => sharedStateFamily.set(key, partial),
    subscribe: (handler) => sharedStateFamily.subscribe(key, handler),
    destroy: () => sharedStateFamily.destroy(key),
  };
}
