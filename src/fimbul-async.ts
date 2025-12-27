/**
 * FimbulAsync - Asynchronous computation manager for dependency graphs
 *
 * FimbulAsync implements an elegant dependency resolution algorithm using directed acyclic graphs (DAGs)
 * for asynchronous computations. It prevents circular references and features automatic topological sorting
 * to ensure computations are executed in the correct order.
 *
 * Unlike its synchronous counterpart, FimbulAsync handles Promise-based computations, allowing for
 * operations like API calls, file I/O, or other asynchronous tasks within the dependency graph.
 *
 * Results are cached to avoid redundant computations within the same execution chain.
 */
import type { Dependencies, ResultObject } from "./fimbul.js";

/**
 * Represents the output of asynchronous computations in the dependency graph.
 * This is a mapped type that wraps each property of the original type `R` in a Promise.
 *
 * @template R - The type representing all possible computation results
 *
 * @example
 * ```typescript
 * type WorldGenResults = {
 *   height: number;
 *   temperature: number;
 *   biome: string;
 * };
 *
 * // AsyncResultObject<WorldGenResults> is equivalent to:
 * // {
 * //   height: Promise<number>;
 * //   temperature: Promise<number>;
 * //   biome: Promise<string>;
 * // }
 * ```
 */
export type AsyncResultObject<R> = { [K in keyof R]: Promise<R[K]> };

/**
 * Represents an asynchronous computation node in the dependency graph.
 * Each node takes input parameters and results from its dependencies,
 * then produces a value or a Promise of a specific type.
 *
 * The function can return either a direct value or a Promise, which will be
 * automatically normalized to a Promise internally.
 *
 * @template P - Type of input parameters passed to all computations
 * @template R - Type representing all possible computation results
 * @template T - The specific return type of this computation
 *
 * @example
 * ```typescript
 * type WorldGenParams = { x: number; y: number; };
 * type WorldGenResults = { height: number; temperature: number; biome: string; };
 *
 * // An async computation node that fetches temperature data from an API
 * const temperatureNode: AsyncComputationNode<WorldGenParams, WorldGenResults, number> =
 *   async ({ x, y }) => {
 *     const response = await fetch(`/api/temperature?x=${x}&y=${y}`);
 *     return response.json();
 *   };
 *
 * // A computation node that combines async and sync operations
 * const biomeNode: AsyncComputationNode<WorldGenParams, WorldGenResults, string> =
 *   async (params, { height, temperature }) => {
 *     const temp = await temperature;
 *     if (height < 0.3) return 'ocean';
 *     if (height > 0.9) return 'snow';
 *     if (temp < 0.3) return 'tundra';
 *     if (temp > 0.8) return 'desert';
 *     return 'forest';
 *   };
 * ```
 */
export type AsyncComputationNode<P, R, T = R[keyof R]> = (params: P, dependencies: ResultObject<R>) => Promise<T> | T;

/** Internal type for Promise-normalized computation nodes */
type ResolvedComputationNode<P, R, T = R[keyof R]> = (input: P, dependencies: AsyncResultObject<R>) => Promise<T>;

/**
 * Interface for the FimbulAsync computation manager. Provides methods to define computation nodes
 * and retrieve computed values asynchronously.
 *
 * The underlying implementation ensures that the computation graph remains a DAG
 * by preventing circular references and automatically sorting nodes topologically.
 *
 * @template P - Type of input parameters passed to all computations
 * @template R - Type representing all possible computation results
 */
export interface FimbulAsyncGraph<P, R> {
  /**
   * Defines an asynchronous computation node in the dependency graph.
   * @template {keyof R} K
   * @param {K} key - Unique identifier for this computation node
   * @param {AsyncComputationNode<P, R, R[K]>} fn - Function that performs the computation
   * @param {Dependencies<R>} [dependencies] - Optional array of keys for nodes this computation depends on
   * @throws {Error} if a node with the same key already exists
   * @throws {Error} Any of the specified dependency nodes do not exist
   */
  define<K extends keyof R>(key: K, fn: AsyncComputationNode<P, R, R[K]>, dependencies?: Dependencies<R>): void;

  /**
   * Checks if a computation node with the given key exists in the graph.
   * @param {keyof R} key - The identifier of the node to check
   * @return {boolean} true if the node exists, false otherwise
   */
  has(key: keyof R): boolean;

  /**
   * Computes and returns a Promise for the value of a specific node.
   * @template {keyof R} K
   * @param {K} key - The identifier of the node to compute
   * @param {P} params - Input parameters to pass to the computation
   * @param {ResultObject<R>} [results] - Optional cache of previously computed results
   * @return {Promise<R[K]>} A Promise that resolves to the computed value of the specified node
   * @throws {Error} if the node with the given key doesn't exist
   */
  get<K extends keyof R, T extends R[K]>(key: K, params: P, results?: ResultObject<R>): Promise<T>;

  /**
   * Computes and returns a Promise for values of multiple nodes.
   * @param {Dependencies<R>} keys - Array of node identifiers to compute
   * @param {P} params - Input parameters to pass to the computations
   * @param {ResultObject<R>} [results] - Optional cache of previously computed results
   * @return {Promise<ResultObject<R>>} A Promise that resolves to an object containing the computed values for all requested keys
   * @throws {Error} if any node with the given keys doesn't exist
   */
  getMany(keys: Dependencies<R>, params: P, results?: ResultObject<R>): Promise<ResultObject<R>>;
}

/**
 * Creates a new FimbulAsync computation manager instance.
 *
 * @template P - Type of input parameters passed to all computations
 * @template R - Type representing all possible computation results
 * @returns {FimbulAsyncGraph<P, R>} A new FimbulAsync computation manager instance
 *
 * @example
 * ```typescript
 * type WorldGenParams = { x: number; y: number; };
 * type WorldGenResults = { height: number; temperature: number; biome: string; };
 *
 * const worldgen = FimbulAsync<WorldGenParams, WorldGenResults>();
 *
 * // Define computation nodes
 * worldgen.define('height', ({ x, y }) => Math.cos(x) * Math.sin(y));
 *
 * // Define an async node that fetches temperature data
 * worldgen.define('temperature',
 *   async ({ x, y }) => {
 *     const response = await fetch(`/api/temperature?x=${x}&y=${y}`);
 *     return response.json();
 *   },
 *   ['height']
 * );
 *
 * // Define a node that combines async and sync operations
 * worldgen.define('biome', async (params, { height, temperature }) => {
 *   const temp = await temperature;
 *   if (height < 0.3) return 'ocean';
 *   if (height > 0.9) return 'snow';
 *   if (temp < 0.3) return 'tundra';
 *   if (temp > 0.8) return 'desert';
 *   return 'forest';
 * }, ['height', 'temperature']);
 *
 * // Get computed value - FimbulAsync automatically handles the dependency resolution and topological sorting
 * const biome = await worldgen.get('biome', { x: Math.random(), y: Math.random() });
 *
 * // Get multiple values
 * const results = await worldgen.getMany(
 *   ['height', 'temperature', 'biome'],
 *   { x: Math.random(), y: Math.random() }
 * );
 * console.log(results); // { height: 0.5, temperature: 0.3, biome: 'forest' }
 * ```
 */
export function FimbulAsync<P, R>(): FimbulAsyncGraph<P, R> {
  const nodes: Map<keyof R, ResolvedComputationNode<P, R, R[keyof R]>> = new Map();
  const notFound = (key: keyof R) => `"${key as string}" not found`;

  function define<K extends keyof R>(key: K, fn: AsyncComputationNode<P, R, R[K]>, dependencies?: Dependencies<R>) {
    if (nodes.has(key)) {
      throw new Error(`"${key as string}" already defined`);
    }

    if (dependencies) {
      for (const depKey of dependencies) {
        if (!nodes.has(depKey)) throw new Error(notFound(depKey));
      }
    }

    nodes.set(key, provideDependencies(fn, dependencies ?? []));
  }

  async function get<K extends keyof R, T extends R[K]>(
    key: K,
    params: P,
    results: ResultObject<R> = {} as ResultObject<R>,
  ): Promise<T> {
    if (results[key] !== undefined) {
      return results[key] as T;
    }

    return resolveComputation(key, params, resultsToPromises(results));
  }

  async function getMany(
    keys: Dependencies<R>,
    params: P,
    results: ResultObject<R> = {} as ResultObject<R>,
  ): Promise<ResultObject<R>> {
    return resolveDependencies(keys, params, resultsToPromises(results));
  }

  function has(key: keyof R) {
    return nodes.has(key);
  }

  async function resolveComputation<K extends keyof R, T extends R[K]>(
    key: K,
    params: P,
    results: AsyncResultObject<R> = {} as AsyncResultObject<R>,
  ): Promise<T> {
    const result = results[key];
    if (result !== undefined) {
      return (await result) as T;
    }

    const fn = nodes.get(key);
    if (!fn) {
      throw new Error(notFound(key));
    }

    results[key] = fn(params, results) as Promise<R[K]>;
    return (await results[key]) as T;
  }

  function provideDependencies<T>(
    fn: AsyncComputationNode<P, R, T>,
    dependencies: Dependencies<R>,
  ): ResolvedComputationNode<P, R, T> {
    return async (params: P, results: AsyncResultObject<R>): Promise<T> => {
      const resolvedDependencies = await resolveDependencies(dependencies, params, results);
      return await fn(params, resolvedDependencies);
    };
  }

  function resultsToPromises<R>(results: ResultObject<R>): AsyncResultObject<R> {
    return Object.fromEntries(
      Object.entries(results).map(([key, value]) => [key, Promise.resolve(value)]),
    ) as AsyncResultObject<R>;
  }

  async function resolveDependencies(
    keys: Dependencies<R>,
    params: P,
    results: AsyncResultObject<R> = {} as AsyncResultObject<R>,
  ): Promise<ResultObject<R>> {
    const asyncResults = keys.map(async (key) => {
      if (!results[key]) {
        results[key] = resolveComputation(key, params, results).catch((error) => {
          throw new Error(`Failed to resolve dependencies for "${key as string}": ${error}`);
        });
      }
      return [key, await results[key]] as const;
    });
    const resolvedResults = await Promise.all(asyncResults);
    return Object.fromEntries(resolvedResults) as ResultObject<R>;
  }

  return {
    define,
    get,
    getMany,
    has,
  };
}
