import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['widget/index.tsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  outfile: 'widget/dist/bundle.iife.js',
  globalName: 'WidgetBundle',   // <- всі експортовані об’єкти автоматично потраплять сюди
  platform: 'browser',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.css': 'css',
    '.png': 'file'
  },
}).then(() => console.log('✅ WidgetBundle built'))
  .catch(err => console.error('❌ Build failed:', err));
