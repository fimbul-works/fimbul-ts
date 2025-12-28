/**
 * Represents the output of computations in the dependency graph.
 * This is a mapped type that preserves the structure of the original type `R`.
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
 * // ResultObject<WorldGenResults> is equivalent to:
 * // {
 * //   height: number;
 * //   temperature: number;
 * //   biome: string;
 * // }
 * ```
 */
export type ResultObject<R> = { [K in keyof R]: R[K] };

/**
 * Represents an array of keys that identify computation nodes in the DAG.
 * Used to specify dependencies between nodes or to request multiple values.
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
 * // Dependencies<WorldGenResults> could be: ['height', 'temperature']
 * // This would create edges from the 'height' and 'temperature' nodes to the dependent node
 * ```
 */
export type Dependencies<R> = Array<keyof R>;

/**
 * Represents a computation node in the dependency graph.
 * Each node takes input parameters and results from its dependencies,
 * then produces a value of a specific type.
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
 * // A computation node that calculates temperature based on height
 * const temperatureNode: ComputationNode<WorldGenParams, WorldGenResults, number> =
 *   ({ y }, { height }) => y - height * 0.8;
 * ```
 */
export type ComputationNode<P, R, T = R[keyof R]> = (params: P, dependencies: ResultObject<R>) => T;

/**
 * Interface for the Fimbul computation manager. Provides methods to define computation nodes and retrieve computed values.
 *
 * The underlying implementation ensures that the computation graph remains a DAG
 * by preventing circular references and automatically sorting nodes topologically.
 *
 * @template P - Type of input parameters passed to all computations
 * @template R - Type representing all possible computation results
 */
export interface FimbulGraph<P, R> {
  /**
   * Defines a computation node in the dependency graph.
   * @template {keyof R} K
   * @param {K} key - Unique identifier for this computation node
   * @param {ComputationNode<P, R, R[K]>} fn - Function that performs the computation. It receives input parameters and results from its dependencies
   * @param {Dependencies<R>} [dependencies] - Optional array of keys for nodes this computation depends on
   * @throws {Error} if a node with the same key already exists
   * @throws {Error} Any of the specified dependency nodes do not exist
   */
  define<K extends keyof R>(key: K, fn: ComputationNode<P, R, R[K]>, dependencies?: Dependencies<R>): void;

  /**
   * Checks if a computation node with the given key exists in the graph.
   * @param {keyof R} key - The identifier of the node to check
   * @return {boolean} true if the node exists, false otherwise
   */
  has(key: keyof R): boolean;

  /**
   * Computes and returns the value of a specific node.
   * @template {keyof R} K
   * @param {K} key - The identifier of the node to compute
   * @param {P} params - Input parameters to pass to the computation
   * @param {ResultObject<R>} [results] - Optional cache of previously computed results
   * @return {R[K]} The computed value of the specified node
   * @throws {Error} if the node with the given key doesn't exist
   */
  get<K extends keyof R, T extends R[K]>(key: K, params: P, results?: ResultObject<R>): T;

  /**
   * Computes and returns values for multiple nodes.
   * @param {Dependencies<R>} keys - Array of node identifiers to compute
   * @param {P} params - Input parameters to pass to the computations
   * @param {ResultObject<R>} [results] - Optional cache of previously computed results
   * @return {ResultObject<R>} An object containing the computed values for all requested keys
   * @throws {Error} if the node with the given key doesn't exist
   */
  getMany(keys: Dependencies<R>, params: P, results?: ResultObject<R>): ResultObject<R>;
}

/**
 * Creates a new Fimbul computation manager instance.
 *
 * @template P - Type of input parameters passed to all computations
 * @template R - Type representing all possible computation results
 * @returns {FimbulGraph<P, R>} A new Fimbul computation manager instance
 *
 * @example
 * ```typescript
 * type WorldGenParams = { x: number; y: number; };
 * type WorldGenResults = { height: number; temperature: number; biome: string; };
 *
 * const worldgen = Fimbul<WorldGenParams, WorldGenResults>();
 *
 * // Define computation nodes
 * worldgen.define('height', ({ x, y }) => Math.cos(x) * Math.sin(y));
 * worldgen.define('temperature',
 *   ({ y }, { height }) => y - height * 0.8,
 *   ['height']
 * );
 * worldgen.define('biome', (params, { height, temperature }) => {
 *   if (height < 0.3) return 'ocean';
 *   if (height > 0.9) return 'snow';
 *   if (height > 0.7) return 'mountain';
 *   if (temperature < 0.3) return 'tundra';
 *   if (temperature > 0.8) return 'desert';
 *  return 'forest';
 * }, ['height', 'temperature']);
 *
 * // Get computed value - Fimbul automatically handles the dependency resolution and topological sorting
 * const biome = worldgen.get('biome', { x: Math.random(), y: Math.random() });
 * ```
 */
export function Fimbul<P, R>(): FimbulGraph<P, R> {
  const nodes: Map<keyof R, ComputationNode<P, R, R[keyof R]>> = new Map();
  const notFound = (key: keyof R) => `"${key as string}" not found`;

  function define<K extends keyof R>(key: K, fn: ComputationNode<P, R, R[K]>, dependencies?: Dependencies<R>) {
    if (nodes.has(key)) {
      throw new Error(`"${key as string}" already defined`);
    }

    if (dependencies) {
      for (const depKey of dependencies) {
        if (!nodes.has(depKey)) throw new Error(notFound(depKey));
      }
    }

    nodes.set(key, dependencies ? provideDependencies(fn, dependencies) : fn);
  }

  function has(key: keyof R) {
    return nodes.has(key);
  }

  function get<K extends keyof R, T extends R[K]>(
    key: K,
    params: P,
    results: ResultObject<R> = {} as ResultObject<R>,
  ): T {
    if (results[key] !== undefined) {
      return results[key] as T;
    }

    const fn = nodes.get(key);
    if (!fn) {
      throw new Error(notFound(key));
    }

    results[key] = fn(params, results) as R[K];
    return results[key] as T;
  }

  function getMany(
    keys: Dependencies<R>,
    params: P,
    results: ResultObject<R> = {} as ResultObject<R>,
  ): ResultObject<R> {
    return keys.reduce((acc, key) => ((acc[key] = get(key, params, results)), acc), results);
  }

  function provideDependencies<T>(
    fn: ComputationNode<P, R, T>,
    dependencies: Dependencies<R>,
  ): ComputationNode<P, R, T> {
    return (params: P, results: ResultObject<R>): T => fn(params, getMany(dependencies, params, results ?? {}));
  }

  return {
    define,
    has,
    get,
    getMany,
  };
}
