/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				'piano-bg': '#1a1a1a',
				'piano-surface': '#2a2a2a',
				'piano-accent': '#3b82f6',
			},
			boxShadow: {
				piano: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
			},
		},
	},
	plugins: [],
}
