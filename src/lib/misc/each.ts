import { funnel } from '../funnel';
import { ArrayIterator, AsyncIterable, AsyncMapper, ConcurrencyOptions } from './types';

/// !doc

/// ## eachAsync
/// ```ts
/// eachAsync<T, O>(iterable: AsyncIterable<Awaited<T>>, iteratee: ArrayIterator<Awaited<T>>): Promise<void>
/// ```
/// Sequentially iterate over (`array`, `Promise of array` or `array of Promises`) elements using iteratee function.
/// The iteratee function can return true to stop iterate.
/// ```ts
/// await eachAsync(Promise.resolve([0, 1, 2]), (value, index) => {
///     console.log(value, index);
/// });
/// ```
export async function eachAsync<T, O>(iterable: AsyncIterable<Awaited<T>>, iteratee: ArrayIterator<Awaited<T>>): Promise<void> {
    let i = 0;
    for await (const elem of await iterable || []) {
        const stopIterate = await iteratee(elem, i++);
        if (stopIterate) {
            return ;
        }
    }
}
