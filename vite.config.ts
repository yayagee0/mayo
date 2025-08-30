import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	test: {
		include: ['test/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['test/setup.ts']
	}
});
