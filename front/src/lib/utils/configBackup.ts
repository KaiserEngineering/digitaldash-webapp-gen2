import { DigitalDashSchema, type DigitalDash } from '$schemas/digitaldash';
import { z } from 'zod/v4';

/**
 * Metadata schema for exported configurations
 */
const ConfigBackupSchema = z.object({
	version: z.literal('1.0'),
	exportDate: z.string(),
	deviceVersion: z.number().optional(),
	config: DigitalDashSchema
});

export type ConfigBackup = z.infer<typeof ConfigBackupSchema>;

/**
 * Export configuration to a JSON file
 * @param config - The DigitalDash configuration to export
 * @param filename - Optional custom filename (defaults to timestamp-based name)
 */
export function exportConfig(config: DigitalDash, filename?: string): void {
	const backup: ConfigBackup = {
		version: '1.0',
		exportDate: new Date().toISOString(),
		deviceVersion: config.general?.[0]?.EE_Version,
		config
	};

	const jsonString = JSON.stringify(backup, null, 2);
	const blob = new Blob([jsonString], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = filename || `digitaldash-config-${new Date().toISOString().slice(0, 10)}.json`;

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}

/**
 * Import and validate configuration from a JSON file
 * @param file - The file to import
 * @returns Promise resolving to validated DigitalDash config
 * @throws Error if validation fails
 */
export async function importConfig(file: File): Promise<DigitalDash> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (event) => {
			try {
				const content = event.target?.result as string;
				const parsed = JSON.parse(content);

				// Check if it's a new backup format with metadata
				if (parsed.version && parsed.config) {
					const backupValidation = ConfigBackupSchema.safeParse(parsed);
					if (!backupValidation.success) {
						throw new Error('Invalid backup file format');
					}
					resolve(backupValidation.data.config);
				} else {
					// Legacy format - raw config object
					const configValidation = DigitalDashSchema.safeParse(parsed);
					if (!configValidation.success) {
						throw new Error('Invalid configuration format');
					}
					resolve(configValidation.data);
				}
			} catch (error) {
				if (error instanceof Error) {
					reject(error);
				} else {
					reject(new Error('Failed to parse configuration file'));
				}
			}
		};

		reader.onerror = () => {
			reject(new Error('Failed to read file'));
		};

		reader.readAsText(file);
	});
}

/**
 * Validate a configuration object without importing
 * @param config - Configuration to validate
 * @returns Validation result with detailed errors
 */
export function validateConfig(config: unknown): {
	valid: boolean;
	errors?: string[];
	config?: DigitalDash;
} {
	const result = DigitalDashSchema.safeParse(config);

	if (result.success) {
		return {
			valid: true,
			config: result.data
		};
	}

	const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);

	return {
		valid: false,
		errors
	};
}

/**
 * Create a shareable configuration string (base64 encoded)
 * Useful for sharing configs via text/URL
 * @param config - Configuration to encode
 * @returns Base64 encoded configuration string
 */
export function encodeConfig(config: DigitalDash): string {
	const backup: ConfigBackup = {
		version: '1.0',
		exportDate: new Date().toISOString(),
		deviceVersion: config.general?.[0]?.EE_Version,
		config
	};

	const jsonString = JSON.stringify(backup);
	return btoa(jsonString);
}

/**
 * Decode a shared configuration string
 * @param encodedConfig - Base64 encoded configuration
 * @returns Decoded and validated configuration
 */
export function decodeConfig(encodedConfig: string): DigitalDash {
	const jsonString = atob(encodedConfig);
	const parsed = JSON.parse(jsonString);

	if (parsed.version && parsed.config) {
		const backupValidation = ConfigBackupSchema.safeParse(parsed);
		if (!backupValidation.success) {
			throw new Error('Invalid encoded configuration');
		}
		return backupValidation.data.config;
	} else {
		const configValidation = DigitalDashSchema.safeParse(parsed);
		if (!configValidation.success) {
			throw new Error('Invalid encoded configuration');
		}
		return configValidation.data;
	}
}
