import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['widget/index.tsx'],
  bundle: true,
  minify: true,                  // включаем минификацию
  format: 'iife',
  outfile: 'widget/dist/bundle.iife.js',
  globalName: 'WidgetBundle',    // This creates window.WidgetBundle
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': '"production"', // реакту сказать, что это продакшн
  },
  external: ['crypto', 'stream'],
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.css': 'css'
  },
}).then(() => console.log('✅ WidgetBundle built'))
  .catch(err => console.error(err));