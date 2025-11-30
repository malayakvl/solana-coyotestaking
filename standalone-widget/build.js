import esbuild from 'esbuild';

// Build configuration
const buildConfig = {
  entryPoints: ['standalone-widget/solana-widget.ts'],
  bundle: true,
  minify: true,
  format: 'iife',
  // Remove globalName to avoid module wrapping
  platform: 'browser',
  outfile: 'standalone-widget/dist/solana-widget.js',
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  loader: {
    '.ts': 'ts',
    '.tsx': 'tsx'
  },
  target: 'es2017'
};

// Build the widget
esbuild.build(buildConfig)
  .then(() => {
    console.log('✅ Solana Widget built successfully!');
    console.log('📁 Output: standalone-widget/dist/solana-widget.js');
    console.log('\n📝 To use the widget:');
    console.log('1. Include React and ReactDOM CDN scripts in your HTML');
    console.log('2. Include the solana-widget.js script');
    console.log('3. The widget will automatically find and replace elements with class "wallet-adapter-button"');
  })
  .catch((error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });