const pkg = require('./package.json');

/** @type {import('vite').UserConfig} */
export default {
  build: {
    target: 'esnext'
  },
  ssr: {
    noExternal: Object.keys(pkg.dependencies || {})
  },
};