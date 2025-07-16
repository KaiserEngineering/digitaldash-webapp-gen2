/**
 * Image processing utilities with Web Worker support
 * Provides a clean interface for image processing tasks
 */

interface PendingRequest {
	resolve: (value: string) => void;
	reject: (reason?: any) => void;
}

let worker: Worker | null = null;
const pendingRequests = new Map<string, PendingRequest>();

function getWorker(): Worker {
	if (!worker) {
		worker = new Worker(new URL('../workers/imageProcessor.ts', import.meta.url), {
			type: 'module'
		});

		worker.onmessage = (event) => {
			const { id, result, error } = event.data;
			const pending = pendingRequests.get(id);

			if (pending) {
				pendingRequests.delete(id);
				if (error) {
					pending.reject(new Error(error));
				} else {
					pending.resolve(result);
				}
			}
		};

		worker.onerror = (error) => {
			console.error('Image processor worker error:', error);
			// Reject all pending requests
			for (const [id, pending] of pendingRequests) {
				pending.reject(new Error('Worker error'));
			}
			pendingRequests.clear();
		};
	}

	return worker;
}

/**
 * Computes the ideal text color (black or white) for an image background
 * Uses Web Worker for better performance
 */
export async function computeIdealTextColor(imageUrl: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const id = crypto.randomUUID();
		const worker = getWorker();

		pendingRequests.set(id, { resolve, reject });

		worker.postMessage({
			type: 'computeIdealTextColor',
			imageUrl,
			id
		});

		// Timeout after 5 seconds
		setTimeout(() => {
			if (pendingRequests.has(id)) {
				pendingRequests.delete(id);
				reject(new Error('Image processing timeout'));
			}
		}, 5000);
	});
}

/**
 * Fallback synchronous implementation for environments without Web Worker support
 */
export async function computeIdealTextColorSync(imageUrl: string): Promise<string> {
	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = 'Anonymous';
		img.src = imageUrl;

		img.onload = () => {
			try {
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext('2d');

				if (ctx) {
					ctx.drawImage(img, 0, 0);
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					let total = 0;

					for (let i = 0; i < imageData.data.length; i += 4) {
						const brightness =
							(imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
						total += brightness;
					}

					const avgBrightness = total / (canvas.width * canvas.height);
					resolve(avgBrightness < 128 ? 'white' : 'black');
				} else {
					resolve('black');
				}
			} catch (error) {
				console.error('Error computing text color:', error);
				resolve('black');
			}
		};

		img.onerror = () => resolve('black');
	});
}

/**
 * Cleanup function to terminate the worker
 */
export function cleanup() {
	if (worker) {
		worker.terminate();
		worker = null;
		pendingRequests.clear();
	}
}
