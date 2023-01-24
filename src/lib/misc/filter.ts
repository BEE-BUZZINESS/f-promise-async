import { AsyncIterable, AsyncPredicate } from './types';

/// !doc

/// ## filterAsync
/// ```ts
/// filterAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<T>): Promise<T[]>
/// ```
/// Filter iterable (`array`, `Promise of array` or `array of Promises`) elements using predicate function.
/// Resolves with filtered array.
/// ```ts
/// const res = await filterAsync(Promise.resolve([0, 1, 2, 3, 4, 5, 6]), (item) => {
///     return item % 2 === 0
/// });
/// console.log(res); // => [0, 2, 4, 6]
/// ```
export async function filterAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<T>): Promise<T[]> {
    const unwrappedIterable = await Promise.all(await iterable);
    const filterResults = await Promise.all(unwrappedIterable.map(predicate));
    return unwrappedIterable.filter((elem, index) => filterResults[index]);
}
