import { AsyncIterable, AsyncPredicate } from './types';

/// !doc

/// ## someAsync
/// ```ts
/// someAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<T>): Promise<boolean>
/// ```
/// Checks if predicate (`array`, `Promise of array` or `array of Promises`) returns truthy for any element of collection.
/// Sequential iteration is stopped once predicate returns truthy.
/// Resolves a boolean.
/// ```ts
/// await someAsync(Promise.resolve([0, 1, 2, 3, 4, 5, 6]), (item) => {
///     return item > 3
/// }); // => true
///
/// await someAsync(Promise.resolve([0, 1, 2, 3, 4, 5, 6]), (item) => {
///     return item > 7
/// }); // => false
/// ```
export async function someAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<Awaited<T>>): Promise<boolean> {
    for await (const elem of await iterable || []) {
        if (await predicate(elem)) {
            return true;
        }
    }
    return false;
}
