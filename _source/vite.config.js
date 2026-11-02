import { defineConfig } from 'vite';
import { readdirSync, readFileSync } from 'node:fs';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'project-catalog',
    generateBundle() {
      const files = ['catalog.json', ...readdirSync('projects', { recursive: true })
        .filter((name) => name.endsWith('.json')).map((name) => `projects/${name.replaceAll('\\', '/')}`)];
      for (const fileName of files) this.emitFile({ type: 'asset', fileName, source: readFileSync(fileName) });
    },
  }],
  build: {
    rollupOptions: {
      input: [
        'index.html',
        ...readdirSync('projects').map((name) => `projects/${name}/index.html`),
      ],
    },
  },
});
