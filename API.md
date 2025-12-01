# Fimbul API Documentation

Complete API for [Fimbul](README.md) - manage complex computation dependencies with automatic topological sorting and built-in caching.

## Functions

- [Fimbul](#fimbul)
- [FimbulAsync](#fimbulasync)

### Fimbul

Creates a new Fimbul computation manager instance.

| Function | Type |
| ---------- | ---------- |
| `Fimbul` | `<P = unknown, R = Record<string, unknown>>() => FimbulGraph<P, R>` |

Returns:

A new Fimbul computation manager instance

Examples:

```typescript
type WorldGenParams = { x: number; y: number; };
type WorldGenResults = { height: number; temperature: number; biome: string; };

const worldgen = Fimbul<WorldGenParams, WorldGenResults>();

// Define computation nodes
worldgen.define('height', ({ x, y }) => Math.cos(x) * Math.sin(y));
worldgen.define('temperature',
  ({ y }, { height }) => y - height * 0.8,
  ['height']
);
worldgen.define('biome', (params, { height, temperature }) => {
  if (height < 0.3) return 'ocean';
  if (height > 0.9) return 'snow';
  if (height > 0.7) return 'mountain';
  if (temperature < 0.3) return 'tundra';
  if (temperature > 0.8) return 'desert';
 return 'forest';
}, ['height', 'temperature']);

// Get computed value - Fimbul automatically handles the dependency resolution and topological sorting
const biome = worldgen.get('biome', { x: Math.random(), y: Math.random() });
```


### FimbulAsync

Creates a new FimbulAsync computation manager instance.

| Function | Type |
| ---------- | ---------- |
| `FimbulAsync` | `<P = unknown, R = Record<string, unknown>>() => FimbulAsyncGraph<P, R>` |

Returns:

A new FimbulAsync computation manager instance

Examples:

```typescript
type WorldGenParams = { x: number; y: number; };
type WorldGenResults = { height: number; temperature: number; biome: string; };

const worldgen = FimbulAsync<WorldGenParams, WorldGenResults>();

// Define computation nodes
worldgen.define('height', ({ x, y }) => Math.cos(x) * Math.sin(y));

// Define an async node that fetches temperature data
worldgen.define('temperature',
  async ({ x, y }) => {
    const response = await fetch(`/api/temperature?x=${x}&y=${y}`);
    return response.json();
  },
  ['height']
);

// Define a node that combines async and sync operations
worldgen.define('biome', async (params, { height, temperature }) => {
  const temp = await temperature;
  if (height < 0.3) return 'ocean';
  if (height > 0.9) return 'snow';
  if (temp < 0.3) return 'tundra';
  if (temp > 0.8) return 'desert';
  return 'forest';
}, ['height', 'temperature']);

// Get computed value - FimbulAsync automatically handles the dependency resolution and topological sorting
const biome = await worldgen.get('biome', { x: Math.random(), y: Math.random() });

// Get multiple values
const results = await worldgen.getMany(
  ['height', 'temperature', 'biome'],
  { x: Math.random(), y: Math.random() }
);
console.log(results); // { height: 0.5, temperature: 0.3, biome: 'forest' }
```




## Interfaces

- [FimbulGraph](#fimbulgraph)
- [FimbulAsyncGraph](#fimbulasyncgraph)

### FimbulGraph

Interface for the Fimbul computation manager. Provides methods to define computation nodes and retrieve computed values.

The underlying implementation ensures that the computation graph remains a DAG
by preventing circular references and automatically sorting nodes topologically.

| Property | Type | Description |
| ---------- | ---------- | ---------- |
| `define` | `<K extends keyof R>(key: K, fn: ComputationNode<P, R, R[K]>, dependencies?: Dependencies<R> or undefined) => void` | Defines a computation node in the dependency graph.<br/> <strong>Parameters:</strong> <ul> <li><strong>key:</strong> Unique identifier for this computation node.</li> <li><strong>fn:</strong> Function that performs the computation. It receives input parameters and results from its dependencies.</li> <li><strong>dependencies:</strong> Optional array of keys for nodes this computation depends on.</li> </ul> <strong>Note:</strong> This method will throw an error if: <ul> <li>A node with the same key already exists.</li> <li>Any of the specified dependency nodes do not exist.</li> <li>Adding this node would create a circular reference in the graph.</li> </ul> |
| `has` | `(key: keyof R) => boolean` | Checks if a computation node with the given key exists in the graph.<br/> <strong>Parameters:</strong> <ul> <li><strong>key:</strong> The identifier of the node to check.</li> </ul> <strong>Returns:</strong> True if the node exists, false otherwise. |
| `get` | `<K extends keyof R>(key: K, params: P, results?: ResultObject<R> or undefined) => R[K]` | Computes and returns the value of a specific node.<br/> <strong>Parameters:</strong> <ul> <li><strong>key:</strong> The identifier of the node to compute.</li> <li><strong>params:</strong> Input parameters to pass to the computation.</li> <li><strong>results:</strong> Optional cache of previously computed results.</li> </ul> <strong>Returns:</strong> The computed value of the specified node.<br/> <strong>Throws:</strong> An error if the node with the given key doesn't exist.<br/> <strong>Caching:</strong> Fimbul automatically caches computation results to avoid redundant calculations. If a node has already been computed with the same parameters, the cached value will be returned instead of recomputing. This ensures each computation node is invoked only once per execution chain, significantly improving performance for complex dependency graphs. |
| `getMany` | `(keys: Dependencies<R>, params: P, results?: ResultObject<R> or undefined) => ResultObject<R>` | Computes and returns values for multiple nodes.<br/> <strong>Parameters:</strong> <ul> <li><strong>keys:</strong> Array of node identifiers to compute.</li> <li><strong>params:</strong> Input parameters to pass to the computations.</li> <li><strong>results:</strong> Optional cache of previously computed results.</li> </ul> <strong>Returns:</strong> An object containing the computed values for all requested keys.<br/> <strong>Throws:</strong> An error if any node with the given keys doesn't exist. |


### FimbulAsyncGraph

Interface for the FimbulAsync computation manager. Provides methods to define computation nodes
and retrieve computed values asynchronously.

The underlying implementation ensures that the computation graph remains a DAG
by preventing circular references and automatically sorting nodes topologically.

| Property | Type | Description |
| ---------- | ---------- | ---------- |
| `define` | `<K extends keyof R>(key: K, fn: AsyncComputationNode<P, R, R[K]>, dependencies?: Dependencies<R> or undefined) => void` | Defines an asynchronous computation node in the dependency graph.<br/> <strong>Parameters:</strong> <ul> <li><strong>key:</strong> Unique identifier for this computation node.</li> <li><strong>fn:</strong> Function that performs the computation. It receives input parameters and results from its dependencies. Can return either a value or a Promise.</li> <li><strong>dependencies:</strong> Optional array of keys for nodes this computation depends on.</li> </ul> <strong>Note:</strong> This method will throw an error if: <ul> <li>A node with the same key already exists.</li> <li>Any of the specified dependency nodes do not exist.</li> <li>Adding this node would create a circular reference in the graph.</li> </ul> |
| `has` | `(key: keyof R) => boolean` | Checks if a computation node with the given key exists in the graph.<br/> <strong>Parameters:</strong> <ul> <li><strong>key:</strong> The identifier of the node to check.</li> </ul> <strong>Returns:</strong> True if the node exists, false otherwise. |
| `get` | `<K extends keyof R>(key: K, params: P, results?: ResultObject<R> or undefined) => Promise<R[K]>` | Computes and returns a Promise for the value of a specific node.<br/> <strong>Parameters:</strong> <ul> <li><strong>key:</strong> The identifier of the node to compute.</li> <li><strong>params:</strong> Input parameters to pass to the computation.</li> <li><strong>results:</strong> Optional cache of previously computed results.</li> </ul> <strong>Returns:</strong> A Promise that resolves to the computed value of the specified node.<br/> <strong>Throws:</strong> An error if the node with the given key doesn't exist. |
| `getMany` | `(keys: Dependencies<R>, params: P, results?: ResultObject<R> or undefined) => Promise<ResultObject<R>>` | Computes and returns a Promise for values of multiple nodes.<br/> <strong>Parameters:</strong> <ul> <li><strong>keys:</strong> Array of node identifiers to compute.</li> <li><strong>params:</strong> Input parameters to pass to the computations.</li> <li><strong>results:</strong> Optional cache of previously computed results.</li> </ul> <strong>Returns:</strong> A Promise that resolves to an object containing the computed values for all requested keys.<br/> <strong>Throws:</strong> An error if any node with the given keys doesn't exist. |


## Types

- [ResultObject](#resultobject)
- [Dependencies](#dependencies)
- [ComputationNode](#computationnode)
- [AsyncResultObject](#asyncresultobject)
- [AsyncComputationNode](#asynccomputationnode)

### ResultObject

Represents the output of computations in the dependency graph.
This is a mapped type that preserves the structure of the original type `R`.

| Type | Type |
| ---------- | ---------- |
| `ResultObject` | `{ [K in keyof R]: R[K] }` |

Examples:

```typescript
type WorldGenResults = {
  height: number;
  temperature: number;
  biome: string;
};

// ResultObject<WorldGenResults> is equivalent to:
// {
//   height: number;
//   temperature: number;
//   biome: string;
// }
```


### Dependencies

Represents an array of keys that identify computation nodes in the DAG.
Used to specify dependencies between nodes or to request multiple values.

| Type | Type |
| ---------- | ---------- |
| `Dependencies` | `Array<keyof R>` |

Examples:

```typescript
type WorldGenResults = {
  height: number;
  temperature: number;
  biome: string;
};

// Dependencies<WorldGenResults> could be: ['height', 'temperature']
// This would create edges from the 'height' and 'temperature' nodes to the dependent node
```


### ComputationNode

Represents a computation node in the dependency graph.
Each node takes input parameters and results from its dependencies,
then produces a value of a specific type.

| Type | Type |
| ---------- | ---------- |
| `ComputationNode` | `( params: P, dependencies: ResultObject<R>, ) => ReturnType` |

Examples:

```typescript
type WorldGenParams = { x: number; y: number; };
type WorldGenResults = { height: number; temperature: number; biome: string; };

// A computation node that calculates temperature based on height
const temperatureNode: ComputationNode<WorldGenParams, WorldGenResults, number> =
  ({ y }, { height }) => y - height * 0.8;
```


### AsyncResultObject

Represents the output of asynchronous computations in the dependency graph.
This is a mapped type that wraps each property of the original type `R` in a Promise.

| Type | Type |
| ---------- | ---------- |
| `AsyncResultObject` | `{ [K in keyof R]: Promise<R[K]> }` |

Examples:

```typescript
type WorldGenResults = {
  height: number;
  temperature: number;
  biome: string;
};

// AsyncResultObject<WorldGenResults> is equivalent to:
// {
//   height: Promise<number>;
//   temperature: Promise<number>;
//   biome: Promise<string>;
// }
```


### AsyncComputationNode

Represents an asynchronous computation node in the dependency graph.
Each node takes input parameters and results from its dependencies,
then produces a value or a Promise of a specific type.

The function can return either a direct value or a Promise, which will be
automatically normalized to a Promise internally.

| Type | Type |
| ---------- | ---------- |
| `AsyncComputationNode` | `( params: P, dependencies: ResultObject<R>, ) => Promise<ReturnType> or ReturnType` |

Examples:

```typescript
type WorldGenParams = { x: number; y: number; };
type WorldGenResults = { height: number; temperature: number; biome: string; };

// An async computation node that fetches temperature data from an API
const temperatureNode: AsyncComputationNode<WorldGenParams, WorldGenResults, number> =
  async ({ x, y }) => {
    const response = await fetch(`/api/temperature?x=${x}&y=${y}`);
    return response.json();
  };

// A computation node that combines async and sync operations
const biomeNode: AsyncComputationNode<WorldGenParams, WorldGenResults, string> =
  async (params, { height, temperature }) => {
    const temp = await temperature;
    if (height < 0.3) return 'ocean';
    if (height > 0.9) return 'snow';
    if (temp < 0.3) return 'tundra';
    if (temp > 0.8) return 'desert';
    return 'forest';
  };
```


