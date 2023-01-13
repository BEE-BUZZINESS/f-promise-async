import { wait } from '../core';

/// !doc

/// # Sleep
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
