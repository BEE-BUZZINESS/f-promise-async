# Sleep  
```ts  
sleep(n: number): Promise<void>  
```  
suspends current coroutine for `ms` milliseconds.  
```ts  
await sleep(ms)  
```  

## timeout  
```ts
timeout<T>(fctOrPromise: Promise<T> | (() => Promise<T>), timeoutMs: number, error?: Error): Promise<T>
```
wait to execute async fonction or promise and throw error if timeout reached
```ts
await timeout(() => fetch('https://ubstream.com'), 250);
const promise = (async () => fetch('https://ubstream.com'))();
await timeout(promise, 250);
```
