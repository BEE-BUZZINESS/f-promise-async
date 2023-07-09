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

// eslint-disable-next-line @typescript-eslint/naming-convention
export let PromiseConstructor = Promise;
export function setPromiseConstructor(f: PromiseConstructor) {
    PromiseConstructor = f;
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
        return new PromiseConstructor<T>((resolve, reject) => {
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
