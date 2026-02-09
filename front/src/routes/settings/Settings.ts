import type { DigitalDash, DigitalDashGeneral } from '$schemas/digitaldash';
import { exportConfig, importConfig } from '$lib/utils/configBackup';
import { configStore } from '$lib/stores/configStore';
import { handleError, withRetry } from '$lib/utils/errorHandling';
import { createLogger } from '$lib/utils/logger';
import toast from 'svelte-5-french-toast';

const log = createLogger({ module: 'settings' });

/**
 * Check if a specific field is available from firmware
 * @param generalSettings - The general settings object from firmware
 * @param fieldName - The name of the field to check
 * @returns true if the field exists in generalSettings
 */
export function hasField(
	generalSettings: DigitalDashGeneral | null | undefined,
	fieldName: string
): boolean {
	return generalSettings ? fieldName in generalSettings : false;
}

/**
 * Handle export configuration
 */
export function handleExport() {
	const config = configStore.getValue();
	if (!config) {
		toast.error('No configuration loaded to export');
		return;
	}

	try {
		exportConfig(config);
		toast.success('Configuration exported successfully!');
	} catch (e) {
		handleError(e, {
			context: 'Exporting configuration',
			fallbackMessage: 'Failed to export configuration'
		});
	}
}

/**
 * Handle import configuration
 * @param event - The file input change event
 * @param onSuccess - Callback to update form data after successful import
 * @param setImporting - Callback to update importing state
 */
export async function handleImport(
	event: Event,
	onSuccess: (config: DigitalDash) => void,
	setImporting: (value: boolean) => void
) {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];

	if (!file) return;

	log.info('Starting config import', { filename: file.name });
	setImporting(true);

	try {
		const importedConfig = await importConfig(file);

		// Save imported configuration to device
		await withRetry(
			async () => {
				const response = await fetch('/api/config', {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(importedConfig)
				});

				if (!response.ok) {
					throw new Error('Failed to save imported configuration to device');
				}

				// Update local store
				configStore.setConfig(importedConfig);

				// Call success callback to update form data
				onSuccess(importedConfig);

				toast.success('Configuration imported and saved successfully!');
			},
			{
				maxRetries: 2,
				delay: 1000
			}
		);
	} catch (e) {
		log.error('Config import failed', e);
		handleError(e, {
			context: 'Importing configuration',
			fallbackMessage: 'Failed to import configuration'
		});
	} finally {
		setImporting(false);
		// Reset file input
		input.value = '';
	}
}
