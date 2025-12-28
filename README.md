
![Fimbul](./images/fimbul-text-logo.png)

Fimbul manages complex computation dependencies using [directed acyclic graphs (DAGs)](https://en.wikipedia.org/wiki/Directed_acyclic_graph). Define your computations, declare their dependencies, and let Fimbul handle the rest.

It automatically prevents circular references, executes computations in the correct order, and only runs each computation once to reduce redundant calculations.

Whether you're generating procedural worlds, handling data transformations, or managing complex state calculations, Fimbul helps you build clear, maintainable, and efficient computation chains.

[![npm version](https://badge.fury.io/js/%40fimbul-works%2Ffimbul.svg)](https://www.npmjs.com/package/@fimbul-works/fimbul)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/microsoft/TypeScript)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Why Fimbul?](#why-fimbul)
- [Core Concepts](#core-concepts)
- [Documentation](#documentation)
- [Examples](#example-world-generator)
- [Advanced Usage](#advanced-usage)
- [License](#license)

## Features

- 🔍 Type-safe dependency graph management with full type inference and validation
- ⚡ Automatic dependency resolution and caching
- 🔄 Both synchronous and asynchronous computation support
- 🧮 Optimal performance with O(n) worst-case complexity
- 🎯 Zero external dependencies
- 📦 Ultra-lightweight

## Installation

```bash
npm install @fimbul-works/fimbul
# or
yarn add @fimbul-works/fimbul
# or
pnpm install @fimbul-works/fimbul
```

## Quick Start

```javascript
import { Fimbul } from '@fimbul-works/fimbul';

const compute = Fimbul();

// Define computation nodes
compute.define('greeting', ({ greeting, recipient }) => `${greeting} ${recipient}`);

compute.define('punctuation', ({ punctuation }) => punctuation ?? '!');

compute.define('output',
  (params, { greeting, punctuation }) => `${greeting}${punctuation}`,
  ['greeting', 'punctuation'] // Declare dependencies
);

// Check if nodes exist
console.log(compute.has('output'));  // true
console.log(compute.has('missing')); // false

// Get a single result
const output = compute.get('output', {
  greeting: 'Hello',
  recipient: 'Fimbul'
});
console.log(output); // "Hello Fimbul!"

// Get multiple results at once
const results = compute.getMany(['greeting', 'punctuation', 'output'], {
  greeting: 'Hello',
  punctuation: '?',
  recipient: 'Fimbul'
});
console.log(results);
// {
//   greeting: "Hello Fimbul",
//   punctuation: "?",
//   output: "Hello Fimbul?"
// }
```

## Why Fimbul?

Unlike manual dependency management or reactive frameworks, Fimbul gives you:
- **Explicit control** over computation flow
- **Zero overhead** - no observers, no subscriptions
- **Predictable performance** - O(n) complexity with perfect caching
- **Type safety** - catch errors at compile time, not runtime

## Core Concepts

### Computation Nodes

Each node in your computation graph represents a discrete calculation unit that:
- Takes input parameters
- Optionally depends on other nodes
- Produces a typed output
- Is computed exactly once per set of parameters
- Can be synchronous or asynchronous

### Dependencies

The dependency system is designed for maximum efficiency and safety:
- Explicit dependency declaration prevents hidden dependencies
- Automatic topological sorting ensures correct execution order
- Built-in cycle detection prevents infinite loops
- Smart caching with result reuse
- Type-safe dependency chains

### Memory Management

Fimbul is designed for optimal memory usage:
- Only stores function definitions
- Minimal memory footprint
- No memory leaks from circular references

## Documentation

For detailed API documentation, see the [API Reference](API.md).

## Example: World Generator

A complete example of a simple world generator using Fimbul and [simplex-noise](https://www.npmjs.com/package/simplex-noise). This example showcases how Fimbul's dependency graph can transform simple inputs into complex, interconnected world features.

```typescript
import { createNoise2D } from 'simplex-noise';

type WorldGenParams = {
  x: number;
  y: number;
  noise2D: (x: number, y: number) => number;
  noiseScale: number;
};

type WorldGenResults = {
  continentShape: number;
  heightNoise: number;
  height: number;
  temperature: number;
  precipitation: number;
  biome: string;
};

const worldgen = Fimbul<WorldGenParams, WorldGenResults>();
```

#### 1. Continent Shapes

First define the basic continent shapes by multiplying sine waves:

```typescript
worldgen.define('continentShape',
  ({ x, y }) =>
    Math.abs(
      Math.sin(x * Math.PI * 2) * Math.sin(y * Math.PI)
    )
);
```

![Continent Shapes](./images/world-gen-continent-shape.png)

The base continent shapes create two large-scale landmasses.

#### 2. Height Variation

Add variation to the height using noise:

```typescript
worldgen.define('heightNoise',
  ({ x, y, noiseScale, noise2D }) =>
    noise2D(x * noiseScale, y * noiseScale) * 0.5 + 0.5
);
```

![Height Noise](./images/world-gen-height-noise.png)

Noise makes the terrain more natural-looking.

#### 3. Combined Height

Combine the continent shapes with height noise by multiplying:

```typescript
worldgen.define('height',
  (params, { continentShape, heightNoise }) =>
    continentShape * heightNoise,
  ['continentShape', 'heightNoise']
);
```

![Final Height](./images/world-gen-height.png)

The result is the final elevation.

#### 4. Temperature

Temperature varies with latitude and elevation:

```typescript
worldgen.define('temperature',
  ({ y }, { height }) =>
    height > 0.4 ? y - (height - 0.4) * 2 : y,
  ['height']
);
```

![Temperature Map](./images/world-gen-temperature.png)

Temperature varies from poles to equator, and higher elevations are colder.

#### 5. Precipitation

Rainfall patterns emerge from temperature:

```typescript
worldgen.define('precipitation',
  (params, { temperature }) => 1 - temperature,
  ['temperature']
);
```

![Precipitation Map](./images/world-gen-precipitation.png)

Precipitation patterns create diverse climate zones.

#### 6. Biomes

Finally, determine biomes based on all previous factors:

```typescript
worldgen.define('biome',
  (params, { height, temperature, precipitation }) => {
    if (height < 0.2023) return 'ocean';
    if (temperature >= 0.666) return 'desert';
    if (temperature > 0.42 && precipitation > 0.42) return 'rainforest';
    if (temperature > 0.3 && precipitation > 0.3) return 'forest';
    if (temperature <= 0.21) return 'tundra';
    return 'meadows';
  },
  ['height', 'temperature', 'precipitation']
);
```

![Biome Map](./images/world-gen-biome.png)

The final biome map shows the rich variety of environments.

#### Generate World Data

```typescript
const noise2D = createNoise2D();

const biome = worldgen.get(
  'biome',
  {
    x: Math.random(),
    y: Math.random(),
    noiseScale: 8,
    noise2D
  }
);
```

This example demonstrates Fimbul's power in managing complex, interdependent calculations. Each step builds upon previous results, creating a simple world from simple mathematical functions - all while maintaining clean, maintainable code structure.

### Async Support

Fimbul provides first-class support for async computations:

```typescript
import { FimbulAsync } from '@fimbul-works/fimbul';

type Params = { base: number };
type Results = { double: number, triple: number };

const compute = FimbulAsync<Params, Results>();

// Define async computation nodes
compute.define('double',
  async ({ base }) => {
    await someAsyncOperation();
    return base * 2;
  }
);

compute.define('triple',
  async ({ base }) => base * 3
);

// Get results
const result = await compute.get('double', { base: 21 }); // 42
```

## Advanced Usage

### Error Handling

Fimbul provides clear error messages for common issues:

```typescript
// Attempting to define duplicate nodes
compute.define('output', fn); // OK
compute.define('output', fn); // Error: "output" already defined

// Missing dependencies
compute.define('derived', fn, ['missing']); // Error: "missing" not found
```

### Type Safety

Fimbul leverages TypeScript's type system to catch errors at compile time:

```typescript
type Params = { base: number };
type Results = { doubled: number };

const compute = Fimbul<Params, Results>();

// Type error: string is not assignable to number
compute.define('doubled', ({base}) => `${base * 2}`);

// Type error: missing dependency
compute.define('tripled', (_, {missing}) => missing * 3);
```

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

Built with ⚡ by [FimbulWorks](https://github.com/fimbul-works)
