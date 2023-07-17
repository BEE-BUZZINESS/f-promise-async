import { AsyncIterable, AsyncPredicate } from './types';

/// !doc

/// ## findAsync
/// ```ts
/// findAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<Awaited<T>>): Promise<T> | undefined
/// ```
/// Sequentially iterates over elements of iterable (`array`, `Promise of array` or `array of Promises`).
/// Resolves the first element that returns truthy for elements using predicate function.
/// ```ts
/// const res = await findAsync(Promise.resolve([0, 1, 2, 3, 4, 5, 6]), (item) => {
///     return item > 2
/// });
/// console.log(res); // => 3
/// ```
export async function findAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<Awaited<T>>): Promise<T | undefined> {
    for await (const elem of await iterable || []) {
        if (await predicate(elem)) {
            return elem;
        }
    }
    return undefined;
}
