// src/lib/config/optionsCache.ts
let cachedOptions: null | Awaited<ReturnType<typeof fetchOptions>> = null;

async function fetchOptions(fetch = globalThis.fetch) {
	const res = await fetch('/api/options');
	if (!res.ok) throw new Error('Failed to fetch options');
	return await res.json();
}

export async function getOptions(fetch = globalThis.fetch) {
	if (!cachedOptions) {
		cachedOptions = await fetchOptions(fetch);
	}
	return cachedOptions;
}
