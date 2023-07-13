import { AsyncIterable, AsyncReducer } from './types';

/// !doc

/// ## reduceAsync
/// ```ts
/// reduceAsync<T, O>(iterable: AsyncIterable<T>, reducer: AsyncReducer<Awaited<T>, O>, accumulator: O): Promise<O>
/// ```
/// Reduce all iterable (`array`, `Promise of array` or `array of Promises`) elements using reducer function.
/// All elements are processed in sequentially.
/// Resolves with reduce value.
/// ```ts
/// const res = await reduceAsync(Promise.resolve([0, 1, 2]), (acc, value, index) => {
///     return acc + value;
/// }, 0);
/// console.log(res); // => 3
/// ```
export async function reduceAsync<T, O>(iterable: AsyncIterable<T>, reducer: AsyncReducer<Awaited<T>, O>, accumulator: O): Promise<O> {
    let acc = accumulator;
    let index = 0;
    for await (const elem of await iterable || []) {
        acc = await reducer(acc, elem, index++);
    }
    return acc;
}
