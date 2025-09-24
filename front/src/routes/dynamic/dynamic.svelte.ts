import type { DigitalDashDynamic } from '$schemas/digitaldash';

// Convert form data to dynamic array (reusable logic)
export function formDataToDynamicArray(formData: any): DigitalDashDynamic[] {
	return Object.values(formData).map((rule) => {
		const { index: _, ...ruleWithoutIndex } = rule as DigitalDashDynamic & {
			index?: number;
		};

		// Ensure view_index is a number if present
		if (ruleWithoutIndex.view_index !== undefined && ruleWithoutIndex.view_index !== null) {
			ruleWithoutIndex.view_index = Number(ruleWithoutIndex.view_index);
		}

		// Ensure Low priority (Default in UI) is always enabled and has required defaults
		if (ruleWithoutIndex.priority === 'Low') {
			ruleWithoutIndex.enable = 'Enabled';
			// Provide default values for required fields that aren't configurable in Default UI
			if (!ruleWithoutIndex.pid) ruleWithoutIndex.pid = '';
			if (!ruleWithoutIndex.compare) ruleWithoutIndex.compare = 'Greater Than';
			if (ruleWithoutIndex.threshold === undefined || ruleWithoutIndex.threshold === null)
				ruleWithoutIndex.threshold = 0;
		}
		return ruleWithoutIndex;
	});
}

// Convert dynamic array back to form object
export function dynamicArrayToFormData(
	dynamicArray: DigitalDashDynamic[]
): Record<string, DigitalDashDynamic & { index: number }> {
	const dynamicObject: Record<string, DigitalDashDynamic & { index: number }> = {};
	dynamicArray.forEach((rule: DigitalDashDynamic, index: number) => {
		const priority = rule.priority?.toLowerCase() || 'low';
		dynamicObject[priority] = { ...rule, index };
	});
	return dynamicObject;
}
