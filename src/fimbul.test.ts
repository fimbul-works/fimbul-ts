import { describe, expect, it, test, vi } from "vitest";
import { Fimbul } from "./fimbul";

describe("Fimbul", () => {
  it("should compute basic operation", () => {
    const dag = new Fimbul<any, { result: number }>();

    dag.define("result", () => 42);

    expect(dag.get("result", {})).toBe(42);
  });

  it("should handle dependency computation", () => {
    const dag = new Fimbul<{ base: number }, { double: number; triple: number }>();

    dag.define("double", ({ base }) => base * 2);
    dag.define("triple", ({ base }) => base * 3);

    expect(dag.get("double", { base: 2 })).toBe(4);
    expect(dag.get("triple", { base: 3 })).toBe(9);
  });

  it("should manage complex dependency tree computations", () => {
    const dag = new Fimbul<{ a: number; b: number }, { sum: number; product: number; combined: number }>();

    dag.define("sum", ({ a, b }) => a + b);
    dag.define("product", ({ a, b }) => a * b);
    dag.define("combined", (_, { sum, product }) => sum + product, ["sum", "product"]);

    expect(dag.get("combined", { a: 2, b: 3 })).toBe(11); // (2 + 3) + (2 * 3)
  });

  it("should return multiple values with getMany", () => {
    const dag = new Fimbul<{ value: number }, { double: number; square: number }>();

    dag.define("double", ({ value }) => value * 2);
    dag.define("square", ({ value }) => value * value);

    const result = dag.getMany(["double", "square"], { value: 3 });

    expect(result.double).toBe(6);
    expect(result.square).toBe(9);
  });

  it("should execute dependency compute function only once when multiple children depend on it", () => {
    const dag = new Fimbul<any, { dependency: number; child1: number; child2: number }>();

    const mockDependencyFunction = vi.fn().mockReturnValue(10);

    dag.define("dependency", mockDependencyFunction);

    dag.define("child1", (_, { dependency }) => dependency + 1, ["dependency"]);
    dag.define("child2", (_, { dependency }) => dependency + 2, ["dependency"]);

    dag.getMany(["child1", "child2"], {});

    expect(mockDependencyFunction).toHaveBeenCalledTimes(1);
  });

  it("should throw error for undefined key", () => {
    type Params = { [key: string]: unknown };
    type Results = { [key: string]: unknown };

    const dag = new Fimbul<Params, Results>();

    expect(() => dag.get("undefinedKey", {})).toThrow(/undefinedKey/);
  });

  test("should throw error when defining a value with undefined dependency value", () => {
    type Params = { base: number };
    type Results = { double: number; triple: number };

    const dag = new Fimbul<Params, Results>();

    expect(() => {
      dag.define("triple", ({ base }) => base * 3, ["double"]);
    }).toThrow(/double/);
  });

  it("should properly cache nullish values and not recompute them", () => {
    const dag = new Fimbul<any, { zero: number; usesZero1: number; usesZero2: number }>();

    const computeZero = vi.fn().mockReturnValue(0);
    dag.define("zero", computeZero);

    dag.define("usesZero1", (_, { zero }) => zero + 1, ["zero"]);
    dag.define("usesZero2", (_, { zero }) => zero + 2, ["zero"]);

    const results = dag.getMany(["usesZero1", "usesZero2"], {});

    expect(results.usesZero1).toBe(1);
    expect(results.usesZero2).toBe(2);
    expect(computeZero).toHaveBeenCalledTimes(1);
  });
});
