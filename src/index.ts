/**
 * Fimbul - Computation manager for dependency graphs.
 *
 * Fimbul implements an elegant dependency resolution algorithm using directed acyclic graphs (DAGs).
 * It prevents circular references and features automatic topological sorting to ensure computations
 * are executed in the correct order.
 */

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
 * @template ReturnType - The specific return type of this computation
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
export type ComputationNode<P = unknown, R = Record<string, unknown>, ReturnType = R[keyof R]> = (
  params: P,
  dependencies: ResultObject<R>,
) => ReturnType;

/**
 * Interface for the Fimbul computation manager. Provides methods to define computation nodes and retrieve computed values.
 *
 * The underlying implementation ensures that the computation graph remains a DAG
 * by preventing circular references and automatically sorting nodes topologically.
 *
 * @template P - Type of input parameters passed to all computations
 * @template R - Type representing all possible computation results
 */
export interface FimbulGraph<P = unknown, R = Record<string, unknown>> {
  /**
   * Defines a computation node in the dependency graph.<br/>
   * <strong>Parameters:</strong>
   * <ul>
   *   <li><strong>key:</strong> Unique identifier for this computation node.</li>
   *   <li><strong>fn:</strong> Function that performs the computation. It receives input parameters and results from its dependencies.</li>
   *   <li><strong>dependencies:</strong> Optional array of keys for nodes this computation depends on.</li>
   * </ul>
   * <strong>Note:</strong> This method will throw an error if:
   * <ul>
   *   <li>A node with the same key already exists.</li>
   *   <li>Any of the specified dependency nodes do not exist.</li>
   *   <li>Adding this node would create a circular reference in the graph.</li>
   * </ul>
   */
  define: <K extends keyof R>(key: K, fn: ComputationNode<P, R, R[K]>, dependencies?: Dependencies<R>) => void;

  /**
   * Checks if a computation node with the given key exists in the graph.<br/>
   * <strong>Parameters:</strong>
   * <ul>
   *  <li><strong>key:</strong> The identifier of the node to check.</li>
   * </ul>
   * <strong>Returns:</strong> True if the node exists, false otherwise.
   */
  has: (key: keyof R) => boolean;

  /**
   * Computes and returns the value of a specific node.<br/>
   * <strong>Parameters:</strong>
   * <ul>
   *   <li><strong>key:</strong> The identifier of the node to compute.</li>
   *   <li><strong>params:</strong> Input parameters to pass to the computation.</li>
   *   <li><strong>results:</strong> Optional cache of previously computed results.</li>
   * </ul>
   * <strong>Returns:</strong> The computed value of the specified node.<br/>
   * <strong>Throws:</strong> An error if the node with the given key doesn't exist.<br/>
   * <strong>Caching:</strong> Fimbul automatically caches computation results to avoid redundant calculations.
   * If a node has already been computed with the same parameters, the cached value will be returned instead of recomputing.
   * This ensures each computation node is invoked only once per execution chain, significantly improving performance for complex dependency graphs.
   */
  get: <K extends keyof R>(key: K, params: P, results?: ResultObject<R>) => R[K];

  /**
   * Computes and returns values for multiple nodes.<br/>
   * <strong>Parameters:</strong>
   * <ul>
   *   <li><strong>keys:</strong> Array of node identifiers to compute.</li>
   *   <li><strong>params:</strong> Input parameters to pass to the computations.</li>
   *   <li><strong>results:</strong> Optional cache of previously computed results.</li>
   * </ul>
   * <strong>Returns:</strong> An object containing the computed values for all requested keys.<br/>
   * <strong>Throws:</strong> An error if any node with the given keys doesn't exist.
   */
  getMany: (keys: Dependencies<R>, params: P, results?: ResultObject<R>) => ResultObject<R>;
}

/**
 * Creates a new Fimbul computation manager instance.
 *
 * @template P - Type of input parameters passed to all computations
 * @template R - Type representing all possible computation results
 * @returns A new Fimbul computation manager instance
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
export function Fimbul<P = unknown, R = Record<string, unknown>>(): FimbulGraph<P, R> {
  const nodes: Map<keyof R, ComputationNode<P, R, R[keyof R]>> = new Map();

  function define<K extends keyof R>(key: K, fn: ComputationNode<P, R, R[K]>, dependencies?: Dependencies<R>) {
    if (nodes.has(key)) {
      throw new Error(`"${key as string}" already defined`);
    }

    if (dependencies) {
      for (const depKey of dependencies) {
        if (!nodes.has(depKey)) throw new Error(`"${depKey as string}" not found`);
      }
    }

    nodes.set(key, dependencies ? provideDependencies(fn, dependencies) : fn);
  }

  function has(key: keyof R) {
    return nodes.has(key);
  }

  function get<K extends keyof R>(
    key: K,
    params: P,
    results: ResultObject<R> = {} as ResultObject<R>,
  ): ResultObject<R>[K] {
    if (results[key] !== undefined) {
      return results[key];
    }

    const fn = nodes.get(key);
    if (!fn) {
      throw new Error(`"${key as string}" not found`);
    }

    results[key] = fn(params, results) as R[K];
    return results[key];
  }

  function getMany(
    keys: Dependencies<R>,
    params: P,
    results: ResultObject<R> = {} as ResultObject<R>,
  ): ResultObject<R> {
    return keys.reduce((acc, key) => ((acc[key] = get(key, params, results)), acc), results);
  }

  /** Wraps computation node to resolve dependencies */
  function provideDependencies<ReturnType>(
    fn: ComputationNode<P, R, ReturnType>,
    dependencies: Dependencies<R>,
  ): ComputationNode<P, R, ReturnType> {
    return (params: P, results: ResultObject<R>): ReturnType =>
      fn(params, getMany(dependencies, params, results ?? {}));
  }

  return {
    define,
    has,
    get,
    getMany,
  };
}

export default Fimbul;
