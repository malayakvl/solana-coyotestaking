import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['widget/index.tsx'],
  bundle: true,
  minify: true, 
  format: 'iife',
  outfile: 'widget/dist/bundle.iife.js',
  globalName: 'WidgetBundle',
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': '"production"', 
  },
  // Mark node-specific packages as external for browser
  external: ['crypto', 'stream'],
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.css': 'css',
    '.png': 'file'
  }
}).then(() => console.log('✅ WidgetBundle built'))
  .catch(err => console.error(err));