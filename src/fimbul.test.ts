import { describe, expect, it, test, vi } from "vitest";
import { Fimbul } from "./fimbul";

type DefaultRecord = Record<string, unknown>;

describe("Fimbul", () => {
  it("should compute basic operation", () => {
    const { define, get } = Fimbul<DefaultRecord, { result: number }>();

    define("result", () => 42);

    expect(get("result", {})).toBe(42);
  });

  it("should handle dependency computation", () => {
    const { define, get } = Fimbul<{ base: number }, { double: number; triple: number }>();

    define("double", ({ base }) => base * 2);
    define("triple", ({ base }) => base * 3);

    expect(get("double", { base: 2 })).toBe(4);
    expect(get("triple", { base: 3 })).toBe(9);
  });

  it("should manage complex dependency tree computations", () => {
    const { define, get } = Fimbul<{ a: number; b: number }, { sum: number; product: number; combined: number }>();

    define("sum", ({ a, b }) => a + b);
    define("product", ({ a, b }) => a * b);
    define("combined", (_, { sum, product }) => sum + product, ["sum", "product"]);

    expect(get("combined", { a: 2, b: 3 })).toBe(11); // (2 + 3) + (2 * 3)
  });

  it("should return multiple values with getMany", () => {
    const { define, getMany } = Fimbul<{ value: number }, { double: number; square: number }>();

    define("double", ({ value }) => value * 2);
    define("square", ({ value }) => value * value);

    const result = getMany(["double", "square"], { value: 3 });

    expect(result.double).toBe(6);
    expect(result.square).toBe(9);
  });

  it("should execute dependency compute function only once when multiple children depend on it", () => {
    const { define, getMany } = Fimbul<DefaultRecord, { dependency: number; child1: number; child2: number }>();

    const mockDependencyFunction = vi.fn().mockReturnValue(10);

    define("dependency", mockDependencyFunction);

    define("child1", (_, { dependency }) => dependency + 1, ["dependency"]);
    define("child2", (_, { dependency }) => dependency + 2, ["dependency"]);

    getMany(["child1", "child2"], {});

    expect(mockDependencyFunction).toHaveBeenCalledTimes(1);
  });

  it("should throw error for undefined key", () => {
    type Params = { [key: string]: unknown };
    type Results = { [key: string]: unknown };

    const { get } = Fimbul<Params, Results>();

    expect(() => get("undefinedKey", {})).toThrow();
  });

  test("should throw error when defining a value with undefined dependency value", () => {
    type Params = { base: number };
    type Results = { double: number; triple: number };

    const { define } = Fimbul<Params, Results>();

    expect(() => {
      define("triple", ({ base }, { double }) => base * 3, ["double"]);
    }).toThrow();
  });

  it("should properly cache nullish values and not recompute them", () => {
    const { define, getMany } = Fimbul<DefaultRecord, { zero: number; usesZero1: number; usesZero2: number }>();

    const computeZero = vi.fn().mockReturnValue(0);
    define("zero", computeZero);

    define("usesZero1", (_, { zero }) => zero + 1, ["zero"]);
    define("usesZero2", (_, { zero }) => zero + 2, ["zero"]);

    const results = getMany(["usesZero1", "usesZero2"], {});

    expect(results.usesZero1).toBe(1);
    expect(results.usesZero2).toBe(2);
    expect(computeZero).toHaveBeenCalledTimes(1);
  });
});
