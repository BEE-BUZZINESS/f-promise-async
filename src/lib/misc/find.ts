import { AsyncIterable, AsyncPredicate } from './types';

/// !doc

/// ## findAsync
/// ```ts
/// findAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<T>): Promise<T> | undefined
/// ```
/// Iterates over elements of iterable (`array`, `Promise of array` or `array of Promises`).
/// Resolves the first element that returns truthy for elements using predicate function.
/// ```ts
/// const res = await findAsync(Promise.resolve([0, 1, 2, 3, 4, 5, 6]), (item) => {
///     return item > 2
/// });
/// console.log(res); // => 3
/// ```
export async function findAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<T>): Promise<T | undefined> {
    const unwrappedIterable = await Promise.all(await iterable);
    for (const elem of unwrappedIterable) {
        if (await predicate(elem)) {
            return elem;
        }
    }
    return undefined;
}
