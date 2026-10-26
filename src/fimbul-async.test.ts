import { describe, expect, it, test, vi } from "vitest";
import { type AsyncComputationNode, FimbulAsync } from "./fimbul-async";

vi.useFakeTimers();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("FimbulAsync", () => {
  it("should compute basic operation with a synchronous ComputeFunction", async () => {
    const dag = new FimbulAsync<any, { result: number }>();

    dag.define("result", () => 42);

    await expect(dag.get("result", {})).resolves.toBe(42);
  });

  it("should handle dependency computation", async () => {
    const dag = new FimbulAsync<{ base: number }, { double: number; triple: number }>();

    dag.define("double", async ({ base }) => base * 2);
    dag.define("triple", async ({ base }) => base * 3);

    await expect(dag.get("double", { base: 2 })).resolves.toBe(4);
    await expect(dag.get("triple", { base: 3 })).resolves.toBe(9);
  });

  it("should manage complex dependency tree computations", async () => {
    const dag = new FimbulAsync<{ a: number; b: number }, { sum: number; product: number; combined: number }>();

    dag.define("sum", async ({ a, b }) => a + b);
    dag.define("product", async ({ a, b }) => a * b);
    dag.define("combined", async (_, { sum, product }) => sum + product, ["sum", "product"]);

    await expect(dag.get("combined", { a: 2, b: 3 })).resolves.toBe(11); // (2 + 3) + (2 * 3)
  });

  it("should return multiple values with getMany", async () => {
    const dag = new FimbulAsync<{ value: number }, { double: number; square: number }>();

    dag.define("double", async ({ value }) => value * 2);
    dag.define("square", async ({ value }) => value * value);

    const result = await dag.getMany(["double", "square"], { value: 3 });

    expect(result.double).toBe(6);
    expect(result.square).toBe(9);
  });

  it("should execute dependency compute function only once when multiple children depend on it", async () => {
    type Result = { dependency: number; child1: number; child2: number };

    const dag = new FimbulAsync<any, Result>();

    const mockDependencyFunction = vi.fn().mockResolvedValue(10 as never) as AsyncComputationNode<any, Result, number>;

    dag.define("dependency", mockDependencyFunction);

    dag.define("child1", async (_, { dependency }) => dependency + 1, ["dependency"]);

    dag.define("child2", async (_, { dependency }) => dependency + 2, ["dependency"]);

    await dag.getMany(["child1", "child2"], {});

    expect(mockDependencyFunction).toHaveBeenCalledTimes(1);
  });

  it("should handle delayed computation with mocked timer", async () => {
    const dag = new FimbulAsync<any, { delayedResult: number }>();

    dag.define("delayedResult", async () => {
      await delay(1000);
      return 100;
    });

    const promise = dag.get("delayedResult", {});

    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;

    expect(result).toBe(100);
  });

  it("should handle concurrent computations correctly", async () => {
    const dag = new FimbulAsync<any, { first: number; second: number }>();

    dag.define("first", async () => 1);

    dag.define("second", async () => 2);

    const results = await dag.getMany(["first", "second"], {});
    expect(results).toEqual({ first: 1, second: 2 });
  });

  it("should resolve dependencies in the correct sequential order", async () => {
    const dag = new FimbulAsync<any, { first: string; second: string; combined: string }>();

    const order: string[] = [];

    dag.define("first", async () => {
      order.push("first");
      return "First";
    });

    dag.define("second", async () => {
      order.push("second");
      return "Second";
    });

    dag.define("combined", async (_, { first, second }) => `${first} and ${second}`, ["first", "second"]);

    await dag.get("combined", {});

    expect(order).toEqual(["first", "second"]);
  });

  it("should handle an existing result cache correctly", async () => {
    const dag = new FimbulAsync<any, { result: number }>();

    dag.define("result", async () => 42);

    await expect(dag.get("result", {}, { result: 42 })).resolves.toBe(42);
  });

  it("should throw error for undefined key", async () => {
    const dag = new FimbulAsync<any, any>();

    await expect(dag.get("undefinedKey", {})).rejects.toThrow();
  });

  test("should throw error when defining a value with undefined dependency value", () => {
    type Params = { base: number };
    type Results = { double: number; triple: number };

    const dag = new FimbulAsync<Params, Results>();

    expect(() => {
      dag.define("triple", async ({ base }) => base * 3, ["double"]);
    }).toThrow();
  });

  it("should correctly handle a failing promise", async () => {
    const dag = new FimbulAsync<any, { errorResult: number }>();

    dag.define("errorResult", () => {
      return new Promise((_, reject) => {
        reject(new Error("Intentional failure"));
      });
    });

    await expect(dag.get("errorResult", {})).rejects.toThrow("Intentional failure");
  });

  it("should compute parallelizable operations in parallel", async () => {
    const dag = new FimbulAsync<any, { a: string; b: string; c: string }>();

    dag.define("a", async () => {
      await delay(1000);
      return "A";
    });

    dag.define("b", async () => {
      await delay(1000);
      return "B";
    });

    dag.define(
      "c",
      (_, { a, b }) => {
        return `${a} ${b}`;
      },
      ["a", "b"],
    );

    const result = dag.get("c", {});

    await vi.advanceTimersByTimeAsync(1000);

    await expect(result).resolves.toBe("A B");
  });
});
