# parallelAsync
```ts
parallelAsync<F extends(() => unknown)[]>(...fns: F): Promise<UnpromisifiedReturnTypes<F>>
```
Execute functions concurrently. Stop execution on first reject.
```ts
await parallelAsync(
    () => fetch('https://ubstream.com'),
    () => fetch('https://debian.org')
    () => fetch('https://github.com')
;
```