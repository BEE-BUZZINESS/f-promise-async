import * as util from 'util';

import { wait } from '../core';

/// !doc

/// # sleep
/// ```ts
/// sleep(n: number): Promise<void>
/// ```
/// suspends current coroutine for `ms` milliseconds.
/// ```ts
/// await sleep(ms)
/// ```
export async function sleep(n: number): Promise<void> {
    return wait(cb => setTimeout(cb, n));
}

/// # waitTimeout
/// ```ts
/// waitTimeout<T>(fctOrPromise: Promise<T> | (() => Promise<T>), timeoutMs: number, error?: Error): Promise<T>
/// ```
/// wait to execute async fonction or promise and throw error if timeout reached
/// ```ts
/// await timeout(() => fetch('https://ubstream.com'), 250);
/// const promise = (async () => fetch('https://ubstream.com'))();
/// await timeout(promise, 250);
/// ```
export async function waitTimeout<T>(fctOrPromise: Promise<T> | (() => Promise<T>), timeoutMs: number, error?: Error): Promise<T> {
    return new Promise(async (resolve: (res: T) => void, reject: (err: any) => void) => {
        let timeout = false;
        const timer = setTimeout(() => {
            timeout = true;
            reject(error || new Error('Timeout'));
        }, timeoutMs);

        try {
            const result = util.types.isPromise(fctOrPromise) 
                ? await fctOrPromise
                : await fctOrPromise();
            if (!timeout) {
                clearTimeout(timer);
                resolve(result);
            }
        } catch (e) {
            if (!timeout) {
                clearTimeout(timer);
                reject(e);
            }
        }
    });
}