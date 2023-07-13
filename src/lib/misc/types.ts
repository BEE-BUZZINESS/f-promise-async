export type ConcurrencyOptions = {
    concurrency: number;
};

export type AsyncIterable<T> = Promise<T>[] | Promise<T[]> | T[];

export type AsyncPredicate<T> = (elem: T) => boolean | Promise<boolean>;

export type AsyncMapper<I, O> = (elem: I, index: number) => O | Promise<O>;

export type AsyncReducer<I, O> = (acc: O, elem: I, index: number) => O | Promise<O>;
