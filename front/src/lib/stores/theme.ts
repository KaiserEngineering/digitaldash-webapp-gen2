import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

// Initialize theme from localStorage or default to light
const defaultTheme: Theme = 'light';
const initialTheme = browser
	? ((localStorage.getItem('theme') as Theme) ?? defaultTheme)
	: defaultTheme;

export const theme = writable<Theme>(initialTheme);

// Apply initial theme on load
if (browser && initialTheme === 'dark') {
	document.documentElement.classList.add('dark');
}

// Save theme to localStorage whenever it changes
theme.subscribe((value) => {
	if (browser) {
		localStorage.setItem('theme', value);
		// Apply theme class to document
		document.documentElement.classList.toggle('dark', value === 'dark');
	}
});

// Function to toggle theme
export function toggleTheme() {
	theme.update((current) => (current === 'light' ? 'dark' : 'light'));
}
