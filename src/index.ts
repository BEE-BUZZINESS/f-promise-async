import { AsyncLocalStorage } from 'async_hooks';

interface RunLocalStorage {
    _20c7abceb95c4eb88b7ca1895b1170d2: {
        runId: number;
        context: any;
    };
}
const asyncLocalStorage = new AsyncLocalStorage<RunLocalStorage>();
const globalContext = {};
let runIdCounter = 0;

export type Callback<T> = (err: any, result?: T) => void;
export type Thunk<T> = (cb: Callback<T>) => void;

// tslint:disable-next-line:variable-name
export let PromiseConsturctor = Promise;
export function setPromiseConstructor(f: PromiseConstructor) {
     PromiseConsturctor = f;
}

///
/// ## run/wait
/// * `promise = run(() => { wait(promise/callback); ... })`
///    create a fake coroutine to write asynchronous code in a asynchronous way !
///    keep that methode to ease f-promise conversion to async/await
///    but also for global context
///
///   * `promise = run(fn)` create a fake coroutine.
///   * `result = await wait(promise/callback)` encapsulate callback.
/**
 * Usefull for callback wait.
 * Can be call outside run !
 * @param promiseOrCallback
 */
export async function wait<T = any>(promiseOrCallback: Promise<T> | Thunk<T>): Promise<T> {
    if (typeof promiseOrCallback === 'function') {
        return new PromiseConsturctor<T>((resolve, reject) => {
            promiseOrCallback((err: Error | undefined, result: T) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    } else {
        return promiseOrCallback;
    }
}

/**
 * Start fake coroutine, with its own local storage
 * @param fn
 *
 * Warning: May result in error "Cannot read property 'Symbol(kResourceStore)' of undefined"
 * with node 14(.5?) at least
 * @see https://github.com/nodejs/node/issues/34556
 */
export async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (typeof fn !== 'function') {
        throw new Error('run() should take a function as argument');
    }
    const runId = ++runIdCounter;
    const parentStorage = asyncLocalStorage.getStore() || { _20c7abceb95c4eb88b7ca1895b1170d2: { context: globalContext } } as RunLocalStorage;
    try {
        return await asyncLocalStorage.run({ _20c7abceb95c4eb88b7ca1895b1170d2: { runId, context: parentStorage._20c7abceb95c4eb88b7ca1895b1170d2.context } }, fn);
    } finally {
        if (!parentStorage._20c7abceb95c4eb88b7ca1895b1170d2.runId) {
            asyncLocalStorage.disable();
        }
    }
}

// goodies

/// ## funnel
/// * `fun = funnel(max)`
///   limits the number of concurrent executions of a given code block.
///
/// The `funnel` function is typically used with the following pattern:
///
/// ``` ts
/// // somewhere
/// var myFunnel = funnel(10); // create a funnel that only allows 10 concurrent executions.
///
/// // elsewhere
/// myFunnel(async function() { /* code with at most 10 concurrent executions */ });
/// ```
///
/// The `funnel` function can also be used to implement critical sections. Just set funnel's `max` parameter to 1.
///
/// If `max` is set to 0, a default number of parallel executions is allowed.
/// This default number can be read and set via `flows.funnel.defaultSize`.
/// If `max` is negative, the funnel does not limit the level of parallelism.
///
/// The funnel can be closed with `fun.close()`.
/// When a funnel is closed, the operations that are still in the funnel will continue but their callbacks
/// won't be called, and no other operation will enter the funnel.
export function funnel(max = -1): Funnel {
    if (typeof max !== 'number') {
        throw new Error('bad max number: ' + max);
    }

    const _max = max === 0 ? exports.funnel.defaultSize : max;

    // Each bottled coroutine use an handshake to be waked up later when an other quit.
    // Before waiting on the handshake, it is pushed to this queue.
    let queue: Handshake[] = [];
    let active = 0;
    let closed = false;

    async function tryEnter<T>(fn: () => Promise<T>): Promise<T> {
        if (active < _max) {
            active++;
            try {
                return await fn();
            } finally {
                active--;
                const hk = queue.shift();
                if (hk) {
                    hk.notify();
                }
            }
        } else {
            return overflow<T>(fn);
        }
    }

    async function overflow<T>(fn: () => Promise<T>): Promise<T> {
        const hk = handshake();
        queue.push(hk);
        await hk.wait();
        if (closed) {
            throw new Error(`cannot execute: funnel has been closed`);
        }
        // A success is not sure, the entry ticket may have already be taken by another,
        // so this one may still be delayed by re-entering in overflow().
        return tryEnter<T>(fn);
    }

    const fun = function<T>(fn: () => Promise<T>): Promise<T> {
        if (closed) {
            throw new Error(`cannot execute: funnel has been closed`);
        }
        if (_max < 0 || _max === Infinity) {
            return fn();
        }
        return tryEnter(fn);
    } as Funnel;

    fun.close = () => {
        queue.forEach(hk => {
            hk.notify();
        });
        queue = [];
        closed = true;
    };
    return fun;
}
(funnel as any).defaultSize = 4;

export interface Funnel {
    <T>(fn: () => Promise<T>): Promise<T>;
    close(): void;
}

///
/// ## handshake and queue
/// * `hs = handshake()`
///   allocates a simple semaphore that can be used to do simple handshakes between two tasks.
///   The returned handshake object has two methods:
///   `await hs.wait()`: waits until `hs` is notified.
///   `hs.notify()`: notifies `hs`.
///   Note: `wait` calls are not queued. An exception is thrown if wait is called while another `wait` is pending.
export function handshake<T = void>(): Handshake<T> {
    let callback: Callback<T> | undefined = undefined,
        notified = false;
    return {
        async wait(): Promise<T> {
            return wait<T>((cb: Callback<T>) => {
                if (callback) throw new Error('already waiting');
                if (notified) setImmediate(cb);
                else callback = cb;
                notified = false;
            });
        },
        notify() {
            if (!callback) notified = true;
            else setImmediate(callback);
            callback = undefined;
        },
    };
}

export interface Handshake<T = void> {
    wait(): Promise<T>;
    notify(): void;
}

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

///
/// ## Continuation local storage (CLS)
///
/// * `result = await withContext(fn, cx)`
///   wraps a function so that it executes with context `cx` (or a wrapper around current context if `cx` is falsy).
///   The previous context will be restored when the function returns (or throws).
///   returns the wrapped function.
export async function withContext<T>(fn: () => Promise<T>, cx: any): Promise<T> {
    const currentStorage = asyncLocalStorage.getStore() || { _20c7abceb95c4eb88b7ca1895b1170d2: { context: globalContext } } as RunLocalStorage;
    const currentContext = currentStorage._20c7abceb95c4eb88b7ca1895b1170d2.context;
    try {
        currentStorage._20c7abceb95c4eb88b7ca1895b1170d2.context = cx;
        return await fn();
    } finally {
        currentStorage._20c7abceb95c4eb88b7ca1895b1170d2.context = currentContext;
    }
}

export function context<T = any>(): T {
    const currentStorage = asyncLocalStorage.getStore() || { _20c7abceb95c4eb88b7ca1895b1170d2: { context: globalContext } } as RunLocalStorage;
    return currentStorage._20c7abceb95c4eb88b7ca1895b1170d2.context;
}

export function runId(): number | undefined {
    const currentStorage = asyncLocalStorage.getStore() || { _20c7abceb95c4eb88b7ca1895b1170d2: { context: globalContext } } as RunLocalStorage;
    return currentStorage._20c7abceb95c4eb88b7ca1895b1170d2.runId;
}

///
/// ## Miscellaneous
///
/// * `results = await map(collection, fn)`
///   creates as many coroutines with `fn` as items in `collection` and wait for them to finish to return result array.
export async function map<T, R>(collection: T[], fn: (val: T) => Promise<R>, ): Promise<R[]> {
    return Promise.all(
        collection.map(item => fn(item)),
    );
}

/// * `await sleep(ms)`
///   suspends current coroutine for `ms` milliseconds.
export async function sleep(n: number): Promise<void> {
    return wait(cb => setTimeout(cb, n));
}

/// * `ok = canWait()`
///   returns whether `wait` calls are allowed (whether we are called from a `run`).
///   not realy applicable since no fibers usage anymore
export function canWait() {
    return (runId() || -1) > 0;
}

/// * `wrapped = eventHandler(handler)`
///   wraps `handler` so that it can call `wait`.
///   the wrapped handler will execute on the current fiber if canWait() is true.
///   otherwise it will be `run` on a new fiber (without waiting for its completion)
export function eventHandler<T extends Function>(handler: T): T {
    const wrapped = async function(this: any, ...args: any[]) {
        if (canWait()) {
            await handler.apply(this, args);
        } else {
            await run(() => withContext(() => handler.apply(this, args), {})).catch(err => {
                console.error(err);
            });
        }
    } as any;
    // preserve arity
    Object.defineProperty(wrapped, 'length', { value: handler.length });
    return wrapped;
}
