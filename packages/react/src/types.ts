export type Selector<Value, SelectedValue> = (value: Value) => SelectedValue;

export type Comparator<T> = (a: T, b: T) => boolean;
