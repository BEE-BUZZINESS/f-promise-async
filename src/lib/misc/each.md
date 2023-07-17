## eachAsync
```ts
eachAsync<T, O>(iterable: AsyncIterable<T>, iteratee: ArrayIterator<Awaited<T>>): Promise<void>
```
Sequentially iterate over (`array`, `Promise of array` or `array of Promises`) elements using iteratee function.
The iteratee function can return true to stop iterate.
```ts
await eachAsync(Promise.resolve([0, 1, 2]), (value, index) => {
    console.log(value, index);
});
```