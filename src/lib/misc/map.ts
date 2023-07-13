/// * `results = await map(collection, fn)`
///   creates as many coroutines with `fn` as items in `collection` and wait for them to finish to return result array.
import { funnel } from '../funnel';
import { AsyncIterable, AsyncMapper, ConcurrencyOptions } from './types';

/// !doc

/** @deprecated Prefer to use mapAsync **/
export async function map<T, R>(arr: T[], fn: (val: T) => Promise<R>): Promise<R[]> {
    return Promise.all(arr.map(fn));
}

/// ## mapAsync
/// ```ts
/// mapAsync<T, O>(iterable: AsyncIterable<T>, mapper: AsyncMapper<T, O>, options?: ConcurrencyOptions): Promise<O[]>
/// ```
/// Map all iterable (`array`, `Promise of array` or `array of Promises`) elements using mapper function.
/// All elements are processed in parallel. Possible to restrict concurrency with options.concurrency.
/// Resolves with mapped array.
/// ```ts
/// const res = await mapAsync(Promise.resolve([0, 1, 2]), (value, index) => {
///     return value * index;
/// });
/// console.log(res); // => [0, 1, 4]
/// ```
export async function mapAsync<T, O>(iterable: AsyncIterable<Awaited<T>>, mapper: AsyncMapper<Awaited<T>, O>, options?: ConcurrencyOptions): Promise<O[]> {
    const unwrappedIterable = await Promise.all(await iterable);
    if ((options?.concurrency || 0) > 0) {
        const fun = funnel(options?.concurrency);
        return Promise.all(unwrappedIterable.map(async (elem, index) => {
            return fun(async () => mapper(elem, index));
        }));
    }
    return Promise.all(unwrappedIterable.map(mapper));
}

/// ## flatMapAsync
/// ```ts
/// flatMapAsync<I, O>(iterable: AsyncIterable<I>, mapper: AsyncMapper<I, O>, options?: ConcurrencyOptions): Promise<O extends (infer Inner)[] ? Inner[] : O[]>
/// ```
/// Same as mapAsync but resolves a flatten array.
/// ```ts
/// const res = await flatMapAsync([[0], [1], [2]], (value, index) => {
///     return value[0] * index;
/// });
/// console.log(res); // => [0, 1, 4]
/// ```
export async function flatMapAsync<I, O>(iterable: AsyncIterable<Awaited<I>>, mapper: AsyncMapper<Awaited<I>, O>, options?: ConcurrencyOptions): Promise<O extends (infer Inner)[] ? Inner[] : O[]> {
    const mapped = await mapAsync(iterable, mapper, options);
    // [].concat(...array) is a polyfill for array.flat()
    return ([] as O[]).concat(...mapped) as O extends (infer Inner)[] ? Inner[] : O[];
}

/// ## mapObjectAsync
/// ```ts
/// mapObjectAsync<T, R>(object: { [key: string]: T }, mapper: (value: T, key: string, index: number) => Promise<R> | R, options?: ConcurrencyOptions): Promise<R[]>
/// ```
/// Process each first level object keys and use mapper function to produce array.
/// First level object values must all have the same type.
/// Resolves the created array.
/// ```ts
/// const res = await mapObjectAsync({ a: 1, b: 2, c: 3 }, (value, key, index) => {
///     return key + '' + (value * index);
/// });
/// console.log(res); // => ['a0', 'b2', 'c6']
/// ```
export async function mapObjectAsync<T, R>(object: { [key: string]: T }, mapper: (value: T, key: string, index: number) => Promise<R> | R, options?: ConcurrencyOptions): Promise<R[]> {
    return mapAsync(Object.keys(object), (key, index) => {
        return mapper(object[key], key, index);
    }, options);
}
