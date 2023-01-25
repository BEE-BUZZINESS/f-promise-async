## findAsync  
```ts  
findAsync<T>(iterable: AsyncIterable<T>, predicate: AsyncPredicate<T>): Promise<T> | undefined  
```  
Iterates over elements of iterable (`array`, `Promise of array` or `array of Promises`).  
Resolves the first element that returns truthy for elements using predicate function.  
```ts  
const res = await findAsync(Promise.resolve([0, 1, 2, 3, 4, 5, 6]), (item) => {  
    return item > 2  
});  
console.log(res); // => 3  
```  
