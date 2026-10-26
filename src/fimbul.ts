import type { Dependencies, ResultObject } from "./types.js";

/**
 * Represents a computation node in the Directed Acyclic Graph (DAG).
 * Each node takes input parameters and resolved dependency outputs,
 * then evaluates and returns a typed result.
 *
 * @template P - Type of input parameters passed to all computations.
 * @template R - Type representing all possible computation results in the graph.
 * @template T - The specific return type of this computation node.
 */
export type ComputationNode<P, R, T = R[keyof R]> = (params: P, dependencies: ResultObject<R>) => T;

/**
 * Demand-Driven Directed Acyclic Graph (DAG) Computation Engine.
 *
 * Manages computation nodes and evaluates dependencies on-demand using
 * topological ordering and call-scoped memoization. Guarantees cycle
 * freedom by construction.
 *
 * @template P - Type of input parameters passed to all computations.
 * @template R - Type representing all possible computation results.
 */
export class Fimbul<P, R> {
  protected n = new Map<keyof R, ComputationNode<P, R, R[keyof R]>>();

  /**
   * Checks if a computation node with the given key exists in the graph.
   * @param {keyof R} key - The identifier of the node to check.
   * @return {boolean} True if the node exists, false otherwise.
   */
  public has(key: keyof R): boolean {
    return this.n.has(key);
  }

  /**
   * Defines a computation node in the DAG.
   * Dependencies must be defined prior to this node, ensuring acyclicity by construction.
   *
   * @template {keyof R} K
   * @param {K} key - Unique identifier for this computation node.
   * @param {ComputationNode<P, R, R[K]>} fn - Function that performs the computation. It receives input parameters and results from its dependencies.
   * @param {Dependencies<R>} [dependencies] - Optional array of keys for upstream nodes this computation depends on.
   * @throws {Error} If a node with the same key already exists.
   * @throws {Error} If any of the specified dependency nodes do not exist.
   */
  public define<K extends keyof R>(key: K, fn: ComputationNode<P, R, R[K]>, dependencies?: Dependencies<R>): this {
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
      dependencies ? (params, results) => fn(params, this.getMany(dependencies, params, results ?? {})) : fn,
    );

    return this;
  }

  /**
   * Evaluates and returns the value of a specific node on-demand.
   * Recursively evaluates any required upstream dependencies, memoizing results in the call cache.
   *
   * @template {keyof R} K
   * @param {K} key - The identifier of the node to compute.
   * @param {P} params - Input parameters to pass to the computation.
   * @param {ResultObject<R>} [results] - Optional cache of previously computed results for call-scoped memoization.
   * @return {R[K]} The computed value of the specified node.
   * @throws {Error} If the node with the given key doesn't exist.
   */
  public get<K extends keyof R, T extends R[K]>(
    key: K,
    params: P,
    results: ResultObject<R> = {} as ResultObject<R>,
  ): T {
    if (key in results) {
      return results[key] as T;
    }

    const fn = this.n.get(key);
    if (!fn) {
      throw new Error(`"${key as string}" is not defined`);
    }

    results[key] = fn(params, results) as R[K];
    return results[key] as T;
  }

  /**
   * Evaluates and returns values for multiple target nodes on-demand.
   * Shares a memoization cache across all requested nodes to prevent redundant evaluations.
   *
   * @param {Dependencies<R>} keys - Array of node identifiers to compute.
   * @param {P} params - Input parameters to pass to the computations.
   * @param {ResultObject<R>} [results] - Optional cache of previously computed results for call-scoped memoization.
   * @return {ResultObject<R>} An object containing the computed values for all requested keys.
   * @throws {Error} If any node with the given key doesn't exist.
   */
  public getMany<K extends Dependencies<R>>(
    keys: K,
    params: P,
    results: ResultObject<R> = {} as ResultObject<R>,
  ): Pick<ResultObject<R>, K[number]> {
    return keys.reduce((acc, key) => ((acc[key] = this.get(key, params, results)), acc), results);
  }
}
