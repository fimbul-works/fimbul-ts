/**
 * Represents the memoized output cache of computations in the computation graph.
 * This is a mapped type that preserves the structure of the original result type `R`.
 *
 * @template R - The type representing all possible computation results.
 */
export type ResultObject<R> = { [K in keyof R]: R[K] };

/**
 * Represents an array of keys that identify upstream computation nodes in the DAG.
 * Used to declare dependencies between nodes or to request multiple evaluated values.
 *
 * @template R - The type representing all possible computation results.
 */
export type Dependencies<R> = Array<keyof R>;
