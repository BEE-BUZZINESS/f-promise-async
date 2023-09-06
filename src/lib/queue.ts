import { Callback, wait } from './core';

/// * `q = new Queue(options)`
///   allocates a queue which may be used to send data asynchronously between two tasks.
///   The `max` option can be set to control the maximum queue length.
///   When `max` has been reached `q.put(data)` discards data and returns false.
///   The returned queue has the following methods:

export interface QueueOptions {
    max?: number;
}
export class Queue<T> {
    _max: number;
    _callback: Callback<T> | undefined;
    _err: any;
    _q: (T | undefined)[] = [];
    _pendingWrites: [Callback<T>, T | undefined][] = [];
    constructor(options?: QueueOptions | number) {
        if (typeof options === 'number') {
            options = {
                max: options,
            };
        }
        options = options || {};
        this._max = options.max != null ? options.max : -1;
    }
    ///   `data = await q.read()`:  dequeue and returns the first item. Waits if the queue is empty. Does not allow concurrent read.
    async read(): Promise<T> {
        return wait<T>((cb: Callback<T>) => {
            if (this._callback) throw new Error('already getting');
            if (this._q.length > 0) {
                const item = this._q.shift();
                // recycle queue when empty to avoid maintaining arrays that have grown large and shrunk
                if (this._q.length === 0) this._q = [];
                setImmediate(() => {
                    cb(this._err, item);
                });
                if (this._pendingWrites.length > 0) {
                    const wr = this._pendingWrites.shift();
                    this._q.push(wr?.[1]);
                    setImmediate(() => {
                        wr && wr[0](this._err, wr[1]);
                    });
                }
            } else {
                this._callback = cb;
            }
        });
    }
    ///   `await q.write(data)`:  queues an item. Waits if the queue is full.
    async write(item: T | undefined): Promise<T> {
        return wait<T>((cb: Callback<T>) => {
            if (this.put(item)) {
                setImmediate(() => {
                    cb(this._err);
                });
            } else {
                this._pendingWrites.push([cb, item]);
            }
        });
    }
    ///   `ok = q.put(data)`: queues an item synchronously. Returns true if the queue accepted it, false otherwise.
    put(item: T | undefined, force?: boolean) {
        if (!this._callback) {
            if (this._max >= 0 && this._q.length >= this._max && !force) return false;
            this._q.push(item);
        } else {
            const cb = this._callback;
            this._callback = undefined;
            setImmediate(() => {
                cb(this._err, item);
            });
        }
        return true;
    }
    ///   `q.end()`: ends the queue. This is the synchronous equivalent of `q.write(_, undefined)`
    end() {
        this.put(undefined, true);
    }
    ///   `data = q.peek()`: returns the first item, without dequeuing it. Returns `undefined` if the queue is empty.
    peek() {
        return this._q[0];
    }
    ///   `array = q.contents()`: returns a copy of the queue's contents.
    contents() {
        return this._q.slice(0);
    }
    ///   `q.adjust(fn[, thisObj])`: adjusts the contents of the queue by calling `newContents = fn(oldContents)`.
    adjust(fn: (old: (T | undefined)[]) => (T | undefined)[]) {
        const nq = fn.call(null, this._q);
        if (!Array.isArray(nq)) throw new Error('adjust function does not return array');
        this._q = nq;
    }
    get length() {
        return this._q.length;
    }
}
