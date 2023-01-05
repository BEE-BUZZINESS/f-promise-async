/// * `results = await map(collection, fn)`
///   creates as many coroutines with `fn` as items in `collection` and wait for them to finish to return result array.
export async function map<T, R>(collection: T[], fn: (val: T) => Promise<R>): Promise<R[]> {
    return Promise.all(
        collection.map(fn),
    );
}
