import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/plugins/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
  },
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
      passes: 2,
      dead_code: true,
      conditionals: true,
      booleans: true,
      unused: true,
      if_return: true,
      join_vars: true,
      collapse_vars: true,
      reduce_vars: true,
      warnings: false,
      negate_iife: false,
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
    },
    mangle: {
      safari10: true,
    },
    format: {
      comments: false,
    },
  },
  onSuccess: 'echo "✅ Build complete!"',
});
