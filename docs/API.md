# [![@fimbul-works/fimbul](../fimbul-logo.svg)](https://www.npmjs.com/package/@fimbul-works/fimbul)

## Classes

### Fimbul

Demand-Driven Directed Acyclic Graph (DAG) Computation Engine.

Manages computation nodes and evaluates dependencies on-demand using
topological ordering and call-scoped memoization. Guarantees cycle
freedom by construction.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-p"></a> `P` | Type of input parameters passed to all computations. |
| <a id="type-parameter-r"></a> `R` | Type representing all possible computation results. |

#### Constructors

##### Constructor

```ts
new Fimbul<P, R>(): Fimbul<P, R>;
```

###### Returns

[`Fimbul`](#fimbul)\<`P`, `R`\>

#### Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-n"></a> `n` | `protected` | `Map`\<keyof `R`, [`ComputationNode`](#computationnode)\<`P`, `R`, `R`\[keyof `R`\]\>\> |

#### Methods

##### define()

```ts
define<K>(
   key, 
   fn, 
   dependencies?
): this;
```

Defines a computation node in the DAG.
Dependencies must be defined prior to this node, ensuring acyclicity by construction.

###### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-k"></a> `K` *extends* `string` \| `number` \| `symbol` |  |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `K` | Unique identifier for this computation node. |
| `fn` | [`ComputationNode`](#computationnode)\<`P`, `R`, `R`\[`K`\]\> | Function that performs the computation. It receives input parameters and results from its dependencies. |
| `dependencies?` | [`Dependencies`](#dependencies)\<`R`\> | Optional array of keys for upstream nodes this computation depends on. |

###### Returns

`this`

###### Throws

If a node with the same key already exists.

###### Throws

If any of the specified dependency nodes do not exist.

##### get()

```ts
get<K, T>(
   key, 
   params, 
   results?
): T;
```

Evaluates and returns the value of a specific node on-demand.
Recursively evaluates any required upstream dependencies, memoizing results in the call cache.

###### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-k-1"></a> `K` *extends* `string` \| `number` \| `symbol` |  |
| <a id="type-parameter-t"></a> `T` | - |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `K` | The identifier of the node to compute. |
| `params` | `P` | Input parameters to pass to the computation. |
| `results?` | [`ResultObject`](#resultobject)\<`R`\> | Optional cache of previously computed results for call-scoped memoization. |

###### Returns

`T`

The computed value of the specified node.

###### Throws

If the node with the given key doesn't exist.

##### getMany()

```ts
getMany<K>(
   keys, 
   params, 
   results?
): Pick<ResultObject<R>, K[number]>;
```

Evaluates and returns values for multiple target nodes on-demand.
Shares a memoization cache across all requested nodes to prevent redundant evaluations.

###### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-k-2"></a> `K` *extends* [`Dependencies`](#dependencies)\<`R`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `keys` | `K` | Array of node identifiers to compute. |
| `params` | `P` | Input parameters to pass to the computations. |
| `results?` | [`ResultObject`](#resultobject)\<`R`\> | Optional cache of previously computed results for call-scoped memoization. |

###### Returns

`Pick`\<[`ResultObject`](#resultobject)\<`R`\>, `K`\[`number`\]\>

An object containing the computed values for all requested keys.

###### Throws

If any node with the given key doesn't exist.

##### has()

```ts
has(key): boolean;
```

Checks if a computation node with the given key exists in the graph.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | keyof `R` | The identifier of the node to check. |

###### Returns

`boolean`

True if the node exists, false otherwise.

***

### FimbulAsync

Asynchronous Demand-Driven Directed Acyclic Graph (DAG) Computation Engine.

Manages asynchronous computation nodes and evaluates dependencies on-demand using
topological ordering and call-scoped memoization. Guarantees cycle freedom by construction.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-p-1"></a> `P` | Type of input parameters passed to all computations. |
| <a id="type-parameter-r-1"></a> `R` | Type representing all possible computation results. |

#### Constructors

##### Constructor

```ts
new FimbulAsync<P, R>(): FimbulAsync<P, R>;
```

###### Returns

[`FimbulAsync`](#fimbulasync)\<`P`, `R`\>

#### Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-n-1"></a> `n` | `protected` | `Map`\<keyof `R`, `ResolvedComputationNode`\<`P`, `R`, `R`\[keyof `R`\]\>\> |

#### Methods

##### define()

```ts
define<K>(
   key, 
   fn, 
   dependencies?
): this;
```

Defines an asynchronous computation node in the DAG.
Dependencies must be defined prior to this node, ensuring acyclicity by construction.

###### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-k-3"></a> `K` *extends* `string` \| `number` \| `symbol` |  |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `K` | Unique identifier for this computation node. |
| `fn` | [`AsyncComputationNode`](#asynccomputationnode)\<`P`, `R`, `R`\[`K`\]\> | Asynchronous function that performs the computation. |
| `dependencies?` | [`Dependencies`](#dependencies)\<`R`\> | Optional array of keys identifying upstream nodes this computation depends on. |

###### Returns

`this`

###### Throws

If a node with the same key already exists.

###### Throws

If any of the specified dependency nodes do not exist.

##### get()

```ts
get<K, T>(
   key, 
   params, 
   results?
): Promise<T>;
```

Evaluates and returns a Promise for the value of a specific node on-demand.
Recursively evaluates any required upstream dependencies, memoizing Promises in the call cache.

###### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-k-4"></a> `K` *extends* `string` \| `number` \| `symbol` |  |
| <a id="type-parameter-t-1"></a> `T` | - |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `K` | The identifier of the node to evaluate. |
| `params` | `P` | Input parameters to pass to the computation. |
| `results?` | [`ResultObject`](#resultobject)\<`R`\> | Optional cache of previously computed results for call-scoped memoization. |

###### Returns

`Promise`\<`T`\>

A Promise that resolves to the computed value of the specified node.

###### Throws

If the node with the given key doesn't exist.

##### getMany()

```ts
getMany<K>(
   keys, 
   params, 
   results?
): Promise<Pick<ResultObject<R>, K[number]>>;
```

Evaluates and returns a Promise for values of multiple target nodes on-demand.
Shares a memoization cache across all requested nodes to prevent redundant evaluations.

###### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-k-5"></a> `K` *extends* [`Dependencies`](#dependencies)\<`R`\> | Type of the requested keys, which is an array of keys of R. |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `keys` | `K` | Array of node identifiers to compute. |
| `params` | `P` | Input parameters to pass to the computations. |
| `results?` | [`ResultObject`](#resultobject)\<`R`\> | Optional cache of previously computed results for call-scoped memoization. |

###### Returns

`Promise`\<`Pick`\<[`ResultObject`](#resultobject)\<`R`\>, `K`\[`number`\]\>\>

A Promise that resolves to an object containing the computed values for all requested keys.

###### Throws

If any node with the given keys doesn't exist.

##### has()

```ts
has(key): boolean;
```

Checks if a computation node with the given key exists in the graph.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | keyof `R` | The identifier of the node to check. |

###### Returns

`boolean`

True if the node exists, false otherwise.

## Type Aliases

### AsyncComputationNode

```ts
type AsyncComputationNode<P, R, T> = (params, dependencies) => Promise<T> | T;
```

Represents an asynchronous computation node in the Directed Acyclic Graph (DAG).
Each node takes input parameters and resolved dependency outputs,
then produces a value or a Promise of a specific type.

The function can return either a direct value or a Promise, which will be
automatically normalized to a Promise internally.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| <a id="type-parameter-p-2"></a> `P` | - | Type of input parameters passed to all computations. |
| <a id="type-parameter-r-2"></a> `R` | - | Type representing all possible computation results in the graph. |
| <a id="type-parameter-t-2"></a> `T` | `R`\[keyof `R`\] | The specific return type of this computation node. |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | `P` |
| `dependencies` | [`ResultObject`](#resultobject)\<`R`\> |

#### Returns

`Promise`\<`T`\> \| `T`

***

### AsyncResultObject

```ts
type AsyncResultObject<R> = { [K in keyof R]: Promise<R[K]> };
```

Represents the memoized output cache of asynchronous computations in the computation graph.
This is a mapped type that wraps each property of the original result type `R` in a Promise.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-r-3"></a> `R` | The type representing all possible computation results. |

***

### ComputationNode

```ts
type ComputationNode<P, R, T> = (params, dependencies) => T;
```

Represents a computation node in the Directed Acyclic Graph (DAG).
Each node takes input parameters and resolved dependency outputs,
then evaluates and returns a typed result.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| <a id="type-parameter-p-3"></a> `P` | - | Type of input parameters passed to all computations. |
| <a id="type-parameter-r-4"></a> `R` | - | Type representing all possible computation results in the graph. |
| <a id="type-parameter-t-3"></a> `T` | `R`\[keyof `R`\] | The specific return type of this computation node. |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | `P` |
| `dependencies` | [`ResultObject`](#resultobject)\<`R`\> |

#### Returns

`T`

***

### Dependencies

```ts
type Dependencies<R> = (keyof R)[];
```

Represents an array of keys that identify upstream computation nodes in the DAG.
Used to declare dependencies between nodes or to request multiple evaluated values.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-r-5"></a> `R` | The type representing all possible computation results. |

***

### ResultObject

```ts
type ResultObject<R> = { [K in keyof R]: R[K] };
```

Represents the memoized output cache of computations in the computation graph.
This is a mapped type that preserves the structure of the original result type `R`.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| <a id="type-parameter-r-6"></a> `R` | The type representing all possible computation results. |
