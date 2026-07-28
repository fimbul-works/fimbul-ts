// WebGL2 Compute-style implementation using Transform Feedback
class WebGLFimbul<TParam extends Record<string, unknown>> {
  private gl: WebGL2RenderingContext;
  private programs: Map<
    string,
    {
      program: WebGLProgram;
      transformFeedback: WebGLTransformFeedback;
      dependencies: string[];
    }
  > = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (!this.gl) throw new Error("WebGL2 not supported");
  }

  define(key: string, computeShader: string, dependencies: string[] = []) {
    const gl = this.gl;

    // Check dependencies
    for (const dep of dependencies) {
      if (!this.programs.has(dep)) {
        throw new Error(`Dependency ${dep} not found`);
      }
    }

    // Create shader program
    const program = gl.createProgram();
    const shader = gl.createShader(gl.COMPUTE_SHADER);
    gl.shaderSource(shader, computeShader);
    gl.compileShader(shader);
    gl.attachShader(program, shader);

    // Setup transform feedback
    const transformFeedback = gl.createTransformFeedback()!;
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);

    this.programs.set(key, {
      program,
      transformFeedback,
      dependencies,
    });
  }

  execute(
    key: string,
    parameters: TParam,
    results: Map<string, Float32Array> = new Map(),
  ) {
    const node = this.programs.get(key);
    if (!node) throw new Error(`Node ${key} not found`);

    // Execute dependencies first
    for (const dep of node.dependencies) {
      if (!results.has(dep)) {
        this.execute(dep, parameters, results);
      }
    }

    const gl = this.gl;
    gl.useProgram(node.program);

    // Bind dependency results as textures
    node.dependencies.forEach((dep, index) => {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + index);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      // Upload dependency data
      const depData = results.get(dep);
      if (!depData) {
        return;
      }
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R32F,
        depData.length,
        1,
        0,
        gl.RED,
        gl.FLOAT,
        depData,
      );
    });

    // Execute compute operation
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, node.transformFeedback);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, 1);
    gl.endTransformFeedback();

    // Read results
    const output = new Float32Array(/* size based on computation */);
    gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, output);
    results.set(key, output);

    return output;
  }
}

// Usage example
const computeShader = `#version 300 es
layout(local_size_x = 256) in;

layout(location = 0) uniform sampler2D dependencyTex;
layout(std430, binding = 0) buffer OutputBuffer {
  float result[];
};

void main() {
  uint idx = gl_GlobalInvocationID.x;
  float depValue = texelFetch(dependencyTex, ivec2(idx, 0), 0).r;
  result[idx] = depValue * 2.0; // Example computation
}
`;
