/**
 * Web Worker for image processing tasks
 * Handles computationally intensive image operations off the main thread
 */

interface ImageProcessorMessage {
	type: 'computeIdealTextColor';
	imageUrl: string;
	id: string;
}

interface ImageProcessorResponse {
	type: 'computeIdealTextColor';
	result: string;
	id: string;
	error?: string;
}

self.onmessage = async (event: MessageEvent<ImageProcessorMessage>) => {
	const { type, imageUrl, id } = event.data;

	try {
		switch (type) {
			case 'computeIdealTextColor':
				const color = await computeIdealTextColor(imageUrl);
				const response: ImageProcessorResponse = {
					type: 'computeIdealTextColor',
					result: color,
					id
				};
				self.postMessage(response);
				break;
			default:
				throw new Error(`Unknown message type: ${type}`);
		}
	} catch (error) {
		const errorResponse: ImageProcessorResponse = {
			type: 'computeIdealTextColor',
			result: 'black',
			id,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
		self.postMessage(errorResponse);
	}
};

async function computeIdealTextColor(imageUrl: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'Anonymous';
		img.src = imageUrl;

		img.onload = () => {
			try {
				const canvas = new OffscreenCanvas(img.width, img.height);
				const ctx = canvas.getContext('2d');

				if (ctx) {
					ctx.drawImage(img, 0, 0);
					const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
					let total = 0;

					// Calculate average brightness
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
				reject(error);
			}
		};

		img.onerror = () => resolve('black');
	});
}
