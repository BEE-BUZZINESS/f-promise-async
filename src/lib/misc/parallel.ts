import { mapAsync } from './map';

/// !doc

/// # parallelAsync
/// ```ts
/// parallelAsync<F extends(() => unknown)[]>(...fns: F): Promise<UnpromisifiedReturnTypes<F>>
/// ```
/// Execute functions concurrently. Stop execution on first reject.
/// ```ts
/// await parallelAsync(
///     () => fetch('https://ubstream.com'),
///     () => fetch('https://debian.org')
///     () => fetch('https://github.com')
///);
/// ```
export async function parallelAsync<F extends(() => unknown)[]>(...fns: F): Promise<UnpromisifiedReturnTypes<F>> {
    return mapAsync(fns, fn => fn()) as Promise<UnpromisifiedReturnTypes<F>>;
}

type UnpromisifiedReturnTypes<F extends (() => unknown)[]> = {
    [K in keyof F]: F[K] extends () => (infer R)
        ? (R extends Promise<infer U> ? U : R)
        : never
};

