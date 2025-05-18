import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/KinkyChat.ks',
    format: 'iife', // or 'iife' or 'umd' as discussed
    name: 'KinkyChat',
  },
  plugins: [
    resolve({
      browser: true, // important for browser-compatible builds
      preferBuiltins: false, // important if some deps try to load 'fs' etc.
    }),
    commonjs(),
    typescript(),
  ],
};