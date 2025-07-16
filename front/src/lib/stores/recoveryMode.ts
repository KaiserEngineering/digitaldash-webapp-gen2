/**
 * Recovery mode store - tracks when the app is using fallback data
 * due to corrupted config or STM32 communication issues
 */
import { writable } from 'svelte/store';

export interface RecoveryState {
	isRecoveryMode: boolean;
	issues: string[];
	timestamp: number;
}

function createRecoveryStore() {
	const { subscribe, set, update } = writable<RecoveryState>({
		isRecoveryMode: false,
		issues: [],
		timestamp: Date.now()
	});

	return {
		subscribe,

		/**
		 * Enter recovery mode with specific issues
		 */
		enterRecoveryMode: (issues: string[]) => {
			set({
				isRecoveryMode: true,
				issues,
				timestamp: Date.now()
			});
		},

		/**
		 * Add additional issue to recovery mode
		 */
		addIssue: (issue: string) => {
			update((state) => ({
				...state,
				issues: [...state.issues, issue],
				timestamp: Date.now()
			}));
		},

		/**
		 * Exit recovery mode
		 */
		exitRecoveryMode: () => {
			set({
				isRecoveryMode: false,
				issues: [],
				timestamp: Date.now()
			});
		},

		/**
		 * Clear all issues
		 */
		clearIssues: () => {
			update((state) => ({
				...state,
				issues: [],
				timestamp: Date.now()
			}));
		}
	};
}

export const recoveryStore = createRecoveryStore();
