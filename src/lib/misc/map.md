## mapAsync  
```ts  
mapAsync<T, O>(iterable: AsyncIterable<T>, mapper: AsyncMapper<T, O>): Promise<O[]>  
```  
Map all iterable (`array`, `Promise of array` or `array of Promises`) elements using mapper function.  
All elements are processed in parallel.  
Resolves with mapped array.  
```ts  
const res = await mapAsync(Promise.resolve([0, 1, 2]), (value, index) => {  
    return value * index;  
});  
console.log(res); // => [0, 1, 4]  
```  
## flatMapAsync  
```ts  
flatMapAsync<I, O>(iterable: AsyncIterable<I>, mapper: AsyncMapper<I, O>): Promise<O extends (infer Inner)[] ? Inner[] : O[]>  
```  
Same as mapAsync but resolves a flatten array.  
```ts  
const res = await flatMapAsync([[0], [1], [2]], (value, index) => {  
    return value[0] * index;  
});  
console.log(res); // => [0, 1, 4]  
```  
## mapObjectAsync  
```ts  
mapObjectAsync<T, R>(object: { [key: string]: T }, mapper: (value: T, key: string, index: number) => Promise<R> | R): Promise<R[]>  
```  
Process each first level object keys and use mapper function to produce array.  
First level object values must all have the same type.  
Resolves the created array.  
```ts  
const res = await mapObjectAsync({ a: 1, b: 2, c: 3 }, (value, key, index) => {  
    return key + '' + (value * index);  
});  
console.log(res); // => ['a0', 'b2', 'c6']  
```  
