import { handshake, Handshake } from './handshake';

/// ## funnel
/// * `fun = funnel(max)`
///   limits the number of concurrent executions of a given code block.
///
/// The `funnel` function is typically used with the following pattern:
///
/// ```ts
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
