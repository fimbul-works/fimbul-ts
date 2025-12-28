/**
 * Fimbul - Computation manager for dependency graphs.
 *
 * Fimbul implements an elegant dependency resolution algorithm using directed acyclic graphs (DAGs).
 * It prevents circular references and features automatic topological sorting to ensure computations
 * are executed in the correct order.
 *
 * Results are cached to avoid redundant computations within the same execution chain.
 */
export * from "./fimbul.js";
export * from "./fimbul-async.js";
