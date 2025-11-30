import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2017',
    outDir: 'dist', // куди буде білд
    lib: {
      entry: 'widget/index.tsx', // головний файл виджета
      name: 'WalletWidget',
      formats: ['iife'], // формат який можна підключати через <script>
      fileName: 'bundle.iife'
    },
    rollupOptions: {
      external: ['react', 'react-dom'], // не включати React у бандл
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      },
      plugins: [
        replace({
          'process.env.NODE_ENV': JSON.stringify('production'),
          preventAssignment: true
        })
      ]
    },
    define: {
      'process.env': {},
      global: {}
    }
  }
});
