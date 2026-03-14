import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Change working directory so Tailwind/PostCSS resolve content paths correctly
process.chdir(__dirname);

const server = await createServer({
  root: __dirname,
  configFile: resolve(__dirname, 'vite.config.ts'),
  server: { port: 5174 },
});

await server.listen();
server.printUrls();
