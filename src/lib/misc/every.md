## everyAsync  
```ts  
everyAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<Awaited<T>>): Promise<boolean>  
```  
Checks if predicate (`array`, `Promise of array` or `array of Promises`) returns truthy for all element of collection.  
Sequential iteration is stopped once predicate returns falsy.
Resolves a boolean.  
```ts  
await everyAsync(Promise.resolve([0, 1, 2, 3, 4, 5, 6]), (item) => {  
    return item > 0  
}); // => true  
await everyAsync(Promise.resolve([0, 1, 2, 3, 4, 5, 6]), (item) => {  
    return item < 5>  
}); // => false  
```  
