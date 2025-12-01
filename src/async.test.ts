import { describe, expect, it, test, vi } from "vitest";
import FimbulAsync, { type AsyncComputationNode } from "./async";

type DefaultRecord = Record<string, unknown>;

vi.useFakeTimers();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("FimbulAsync", () => {
  it("should compute basic operation with a synchronous ComputeFunction", async () => {
    const { define, get } = FimbulAsync<DefaultRecord, { result: number }>();

    define("result", () => 42);

    await expect(get("result", {})).resolves.toBe(42);
  });

  it("should handle dependency computation", async () => {
    const { define, get } = FimbulAsync<{ base: number }, { double: number; triple: number }>();

    define("double", async ({ base }) => base * 2);
    define("triple", async ({ base }) => base * 3);

    await expect(get("double", { base: 2 })).resolves.toBe(4);
    await expect(get("triple", { base: 3 })).resolves.toBe(9);
  });

  it("should manage complex dependency tree computations", async () => {
    const { define, get } = FimbulAsync<{ a: number; b: number }, { sum: number; product: number; combined: number }>();

    define("sum", async ({ a, b }) => a + b);
    define("product", async ({ a, b }) => a * b);
    define("combined", async (input, { sum, product }) => sum + product, ["sum", "product"]);

    await expect(get("combined", { a: 2, b: 3 })).resolves.toBe(11); // (2 + 3) + (2 * 3)
  });

  it("should return multiple values with getMany", async () => {
    const { define, getMany } = FimbulAsync<{ value: number }, { double: number; square: number }>();

    define("double", async ({ value }) => value * 2);
    define("square", async ({ value }) => value * value);

    const result = await getMany(["double", "square"], { value: 3 });

    expect(result.double).toBe(6);
    expect(result.square).toBe(9);
  });

  it("should execute dependency compute function only once when multiple children depend on it", async () => {
    type Result = { dependency: number; child1: number; child2: number };

    const { define, getMany } = FimbulAsync<DefaultRecord, Result>();

    const mockDependencyFunction = vi.fn().mockResolvedValue(10 as never) as AsyncComputationNode<
      DefaultRecord,
      Result,
      number
    >;

    define("dependency", mockDependencyFunction);

    define("child1", async (input, { dependency }) => dependency + 1, ["dependency"]);

    define("child2", async (input, { dependency }) => dependency + 2, ["dependency"]);

    await getMany(["child1", "child2"], {});

    expect(mockDependencyFunction).toHaveBeenCalledTimes(1);
  });

  it("should handle delayed computation with mocked timer", async () => {
    const { define, get } = FimbulAsync<DefaultRecord, { delayedResult: number }>();

    define("delayedResult", async () => {
      await delay(1000);
      return 100;
    });

    const promise = get("delayedResult", {});

    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;

    expect(result).toBe(100);
  });

  it("should handle concurrent computations correctly", async () => {
    const { define, getMany } = FimbulAsync<DefaultRecord, { first: number; second: number }>();

    define("first", async () => 1);

    define("second", async () => 2);

    const results = await getMany(["first", "second"], {});
    expect(results).toEqual({ first: 1, second: 2 });
  });

  it("should resolve dependencies in the correct sequential order", async () => {
    const { define, get } = FimbulAsync<DefaultRecord, { first: string; second: string; combined: string }>();

    const order: string[] = [];

    define("first", async () => {
      order.push("first");
      return "First";
    });

    define("second", async () => {
      order.push("second");
      return "Second";
    });

    define("combined", async (input, { first, second }) => `${first} and ${second}`, ["first", "second"]);

    await get("combined", {});

    expect(order).toEqual(["first", "second"]);
  });

  it("should throw error for undefined key", async () => {
    const { get } = FimbulAsync<DefaultRecord, DefaultRecord>();

    await expect(get("undefinedKey", {})).rejects.toThrow();
  });

  test("should throw error when defining a value with undefined dependency value", () => {
    type Params = { base: number };
    type Results = { double: number; triple: number };

    const { define } = FimbulAsync<Params, Results>();

    expect(() => {
      define("triple", async ({ base }, { double }) => base * 3, ["double"]);
    }).toThrow();
  });

  it("should correctly handle a failing promise", async () => {
    const { define, get } = FimbulAsync<DefaultRecord, { errorResult: number }>();

    define("errorResult", () => {
      return new Promise((_, reject) => {
        reject(new Error("Intentional failure"));
      });
    });

    await expect(get("errorResult", {})).rejects.toThrow("Intentional failure");
  });

  it("should compute parallelizable operations in parallel", async () => {
    const { define, get } = FimbulAsync<DefaultRecord, { a: string; b: string; c: string }>();

    define("a", async () => {
      await delay(1000);
      return "A";
    });

    define("b", async () => {
      await delay(1000);
      return "B";
    });

    define(
      "c",
      (_, { a, b }) => {
        return `${a} ${b}`;
      },
      ["a", "b"],
    );

    const result = get("c", {});

    await vi.advanceTimersByTimeAsync(1000);

    await expect(result).resolves.toBe("A B");
  });
});
