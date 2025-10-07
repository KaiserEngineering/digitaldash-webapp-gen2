import type { DigitalDashAlert } from '$schemas/digitaldash';

// Convert form data to alerts array (reusable logic)
export function formDataToAlertsArray(formData: any): DigitalDashAlert[] {
	return Object.values(formData).map((alert) => {
		const { index: _, ...alertWithoutIndex } = alert as DigitalDashAlert & {
			index?: number;
		};
		return alertWithoutIndex;
	});
}

// Convert alerts array back to form object
export function alertsArrayToFormData(
	alertsArray: DigitalDashAlert[]
): Record<string, DigitalDashAlert & { index: number }> {
	const alertsObject: Record<string, DigitalDashAlert & { index: number }> = {};
	alertsArray.forEach((alert: DigitalDashAlert, index: number) => {
		alertsObject[index] = { ...alert, index };
	});
	return alertsObject;
}
