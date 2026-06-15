import toast from 'svelte-5-french-toast';

type BusyResponse = {
	busy?: boolean;
	operation?: string;
	message?: string;
	error?: string;
};

export class CommandBusyError extends Error {
	operation: string;

	constructor(operation = 'command') {
		super(`${operation} is already in progress`);
		this.name = 'CommandBusyError';
		this.operation = operation;
	}
}

export async function errorFromResponse(
	response: Response,
	fallbackMessage: string
): Promise<Error> {
	const body = (await response.json().catch(() => null)) as BusyResponse | null;

	if (response.status === 409 || body?.busy) {
		return new CommandBusyError(body?.operation || 'command');
	}

	return new Error(body?.error || body?.message || fallbackMessage);
}

export function showCommandBusyToast(error: unknown): error is CommandBusyError {
	if (!(error instanceof CommandBusyError)) {
		return false;
	}

	toast.error(`Please wait. ${error.operation} is already in progress.`);
	return true;
}
