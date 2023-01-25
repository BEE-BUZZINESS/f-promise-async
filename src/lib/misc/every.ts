import { AsyncIterable, AsyncPredicate } from './types';

/// !doc

/// ## everyAsync
/// ```ts
/// everyAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<T>): Promise<boolean>
/// ```
/// Checks if predicate (`array`, `Promise of array` or `array of Promises`) returns truthy for all element of collection.
/// Iteration is stopped once predicate returns falsey.
/// Resolves a boolean.
/// ```ts
/// await everyAsync(Promise.resolve([0, 1, 2, 3, 4, 5, 6]), (item) => {
///     return item > 0
/// }); // => true
///
/// await everyAsync(Promise.resolve([0, 1, 2, 3, 4, 5, 6]), (item) => {
///     return item < 5>
/// }); // => false
/// ```
export async function everyAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<Awaited<T>>): Promise<boolean> {
    const unwrappedIterable = await Promise.all(await iterable);
    for (const elem of unwrappedIterable) {
        if (!(await predicate(elem))) {
            return false;
        }
    }
    return true;
}
