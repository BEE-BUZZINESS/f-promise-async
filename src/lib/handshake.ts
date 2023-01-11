import { Callback, wait } from './core';

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
