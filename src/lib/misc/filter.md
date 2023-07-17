## filterAsync  
```ts  
filterAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<Awaited<T>>, options?: ConcurrencyOptions): Promise<Awaited<T>[]>  
```  
Filter iterable (`array`, `Promise of array` or `array of Promises`) elements using predicate function.
All elements are processed in parallel. Possible to restrict concurrency with options.concurrency.
Resolves with filtered array.  
```ts  
const res = await filterAsync(Promise.resolve([0, 1, 2, 3, 4, 5, 6]), (item) => {  
    return item % 2 === 0  
});  
console.log(res); // => [0, 2, 4, 6]  
```  
