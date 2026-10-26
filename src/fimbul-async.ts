import type { Dependencies, ResultObject } from "./types.js";

/**
 * Represents the memoized output cache of asynchronous computations in the computation graph.
 * This is a mapped type that wraps each property of the original result type `R` in a Promise.
 *
 * @template R - The type representing all possible computation results.
 */
export type AsyncResultObject<R> = { [K in keyof R]: Promise<R[K]> };

/**
 * Represents an asynchronous computation node in the Directed Acyclic Graph (DAG).
 * Each node takes input parameters and resolved dependency outputs,
 * then produces a value or a Promise of a specific type.
 *
 * The function can return either a direct value or a Promise, which will be
 * automatically normalized to a Promise internally.
 *
 * @template P - Type of input parameters passed to all computations.
 * @template R - Type representing all possible computation results in the graph.
 * @template T - The specific return type of this computation node.
 */
export type AsyncComputationNode<P, R, T = R[keyof R]> = (params: P, dependencies: ResultObject<R>) => Promise<T> | T;

/** Internal type for Promise-normalized computation nodes */
export type ResolvedComputationNode<P, R, T = R[keyof R]> = (
  input: P,
  dependencies: AsyncResultObject<R>,
) => Promise<T>;

/**
 * Asynchronous Demand-Driven Directed Acyclic Graph (DAG) Computation Engine.
 *
 * Manages asynchronous computation nodes and evaluates dependencies on-demand using
 * topological ordering and call-scoped memoization. Guarantees cycle freedom by construction.
 *
 * @template P - Type of input parameters passed to all computations.
 * @template R - Type representing all possible computation results.
 */
export class FimbulAsync<P, R> {
  protected n = new Map<keyof R, ResolvedComputationNode<P, R, R[keyof R]>>();

  /**
   * Checks if a computation node with the given key exists in the graph.
   * @param {keyof R} key - The identifier of the node to check.
   * @return {boolean} True if the node exists, false otherwise.
   */
  public has(key: keyof R): boolean {
    return this.n.has(key);
  }

  /**
   * Defines an asynchronous computation node in the DAG.
   * Dependencies must be defined prior to this node, ensuring acyclicity by construction.
   *
   * @template {keyof R} K
   * @param {K} key - Unique identifier for this computation node.
   * @param {AsyncComputationNode<P, R, R[K]>} fn - Asynchronous function that performs the computation.
   * @param {Dependencies<R>} [dependencies] - Optional array of keys identifying upstream nodes this computation depends on.
   * @throws {Error} If a node with the same key already exists.
   * @throws {Error} If any of the specified dependency nodes do not exist.
   */
  public define<K extends keyof R>(key: K, fn: AsyncComputationNode<P, R, R[K]>, dependencies?: Dependencies<R>): this {
    if (this.n.has(key)) {
      throw new Error(`"${key as string}" is already defined`);
    }

    dependencies?.forEach(
      (depKey) =>
        !this.n.has(depKey) &&
        (() => {
          throw new Error(`"${depKey as string}" is not defined`);
        })(),
    );

    this.n.set(
      key,
      dependencies
        ? async (params: P, results: AsyncResultObject<R>): Promise<R[K]> =>
            fn(params, await this.resolveGetMany(dependencies, params, results))
        : (fn as ResolvedComputationNode<P, R, R[K]>),
    );

    return this;
  }

  /**
   * Evaluates and returns a Promise for the value of a specific node on-demand.
   * Recursively evaluates any required upstream dependencies, memoizing Promises in the call cache.
   *
   * @template {keyof R} K
   * @param {K} key - The identifier of the node to evaluate.
   * @param {P} params - Input parameters to pass to the computation.
   * @param {ResultObject<R>} [results] - Optional cache of previously computed results for call-scoped memoization.
   * @return {Promise<R[K]>} A Promise that resolves to the computed value of the specified node.
   * @throws {Error} If the node with the given key doesn't exist.
   */
  public async get<K extends keyof R, T extends R[K]>(
    key: K,
    params: P,
    results: ResultObject<R> = {} as ResultObject<R>,
  ): Promise<T> {
    if (key in results) {
      return results[key] as T;
    }
    return this.resolveGet(key, params, this.promisifyResults(results));
  }

  /**
   * Evaluates and returns a Promise for values of multiple target nodes on-demand.
   * Shares a memoization cache across all requested nodes to prevent redundant evaluations.
   *
   * @template K - Type of the requested keys, which is an array of keys of R.
   * @param {Dependencies<R>} keys - Array of node identifiers to compute.
   * @param {P} params - Input parameters to pass to the computations.
   * @param {ResultObject<R>} [results] - Optional cache of previously computed results for call-scoped memoization.
   * @return {Promise<Pick<ResultObject<R>, K[number]>>} A Promise that resolves to an object containing the computed values for all requested keys.
   * @throws {Error} If any node with the given keys doesn't exist.
   */
  public async getMany<K extends Dependencies<R>>(
    keys: K,
    params: P,
    results: ResultObject<R> = {} as ResultObject<R>,
  ): Promise<Pick<ResultObject<R>, K[number]>> {
    return this.resolveGetMany(keys, params, this.promisifyResults(results));
  }

  /**
   * Resolves a single computation node and returns its computed value.
   * @template K - The type of the node identifier.
   * @template T - The type of the computed value.
   * @param {K} key - The identifier of the node to resolve.
   * @param {P} params - Input parameters for the computation.
   * @param {AsyncResultObject<R>} [results] - Optional cache of previously computed results.
   * @return {Promise<T>} A Promise that resolves to the computed value of the specified node.
   * @throws {Error} If the node with the given key doesn't exist.
   */
  private async resolveGet<K extends keyof R, T extends R[K]>(
    key: K,
    params: P,
    results: AsyncResultObject<R> = {} as AsyncResultObject<R>,
  ): Promise<T> {
    if (key in results) {
      return (await results[key]) as T;
    }

    const fn = this.n.get(key);
    if (!fn) {
      throw new Error(`"${key as string}" is not defined`);
    }

    results[key] = fn(params, results) as Promise<R[K]>;
    return (await results[key]) as T;
  }

  /**
   * Resolves multiple computation nodes and returns their computed values.
   * @template R - The type representing all possible computation results.
   * @param {Dependencies<R>} keys - Array of keys for nodes to resolve.
   * @param {P} params - Input parameters for the computations.
   * @param {AsyncResultObject<R>} [results] - Optional cache of previously computed results.
   * @return {Promise<Pick<ResultObject<R>, K[number]>>} A Promise that resolves to an object containing the computed values for all requested keys.
   * @throws {Error} If any of the specified nodes don't exist or fail to resolve.
   */
  private async resolveGetMany<K extends Dependencies<R>>(
    keys: K,
    params: P,
    results: AsyncResultObject<R> = {} as AsyncResultObject<R>,
  ): Promise<Pick<ResultObject<R>, K[number]>> {
    return Object.fromEntries(
      await Promise.all(
        keys.map(async (key) => {
          if (!(key in results)) {
            results[key] = this.resolveGet(key, params, results).catch((error) => {
              throw new Error(`Failed to resolve dependencies for "${key as string}": ${error}`);
            });
          }
          return [key, await results[key]];
        }),
      ),
    ) as Pick<ResultObject<R>, K[number]>;
  }

  /**
   * Converts a synchronous result object to an asynchronous one by wrapping each value in a Promise.
   * @param {ResultObject<R>} results - The synchronous result object to convert.
   * @return {AsyncResultObject<R>} An asynchronous result object with all values wrapped in Promises.
   */
  private promisifyResults<R>(results: ResultObject<R>): AsyncResultObject<R> {
    return Object.fromEntries(
      Object.entries(results).map(([key, value]) => [key, Promise.resolve(value)]),
    ) as AsyncResultObject<R>;
  }
}
