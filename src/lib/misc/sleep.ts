import { wait } from '../core';

/// * `await sleep(ms)`
///   suspends current coroutine for `ms` milliseconds.
export async function sleep(n: number): Promise<void> {
    return wait(cb => setTimeout(cb, n));
}
