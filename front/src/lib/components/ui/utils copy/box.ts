/*
	Installed from github/ieedan/shadcn-svelte-extras
*/

import type { ReadableBox, WritableBox } from 'svelte-toolbelt';

export type Box<T> = ReadableBox<T> | WritableBox<T>;

export type WritableBoxedValues<T> = {
	[K in keyof T]: WritableBox<T[K]>;
};

export type ReadableBoxedValues<T> = {
	[K in keyof T]: ReadableBox<T[K]>;
};
