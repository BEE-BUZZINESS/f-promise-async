import { funnel } from '../funnel';
import { AsyncIterable, AsyncPredicate, ConcurrencyOptions } from './types';

/// !doc

/// ## filterAsync
/// ```ts
/// filterAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<T>, options?: ConcurrencyOptions): Promise<T[]>
/// ```
/// Filter iterable (`array`, `Promise of array` or `array of Promises`) elements using predicate function.
/// All elements are processed in parallel. Possible to restrict concurrency with options.concurrency.
/// Resolves with filtered array.
/// ```ts
/// const res = await filterAsync(Promise.resolve([0, 1, 2, 3, 4, 5, 6]), (item) => {
///     return item % 2 === 0
/// });
/// console.log(res); // => [0, 2, 4, 6]
/// ```
export async function filterAsync<T>(iterable: AsyncIterable<Awaited<T>>, predicate: AsyncPredicate<Awaited<T>>, options?: ConcurrencyOptions): Promise<Awaited<T>[]> {
    const unwrappedIterable = await Promise.all(await iterable);
    let filterResults: boolean[] = [];
    if ((options?.concurrency || 0) > 0) {
        const fun = funnel(options?.concurrency);
        filterResults = await Promise.all(unwrappedIterable.map(async elem => {
            return fun(async () => predicate(elem));
        }));
    } else {
        filterResults = await Promise.all(unwrappedIterable.map(predicate));
    }
    return unwrappedIterable.filter((elem, index) => filterResults[index]);
}
