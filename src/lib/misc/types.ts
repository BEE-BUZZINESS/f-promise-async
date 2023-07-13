export type ConcurrencyOptions = {
    concurrency: number;
};

export type AsyncIterable<T> = Promise<T>[] | Promise<T[]> | T[];

export type ArrayIterator<T> = (elem: T, index: number) => void | boolean | Promise<void | boolean>;

export type AsyncPredicate<T> = (elem: T) => boolean | Promise<boolean>;

export type AsyncMapper<I, O> = (elem: I, index: number) => O | Promise<O>;

export type AsyncReducer<I, O> = (acc: O, elem: I, index: number) => O | Promise<O>;
