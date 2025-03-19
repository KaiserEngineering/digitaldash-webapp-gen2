<script lang="ts">
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-5-french-toast';
	import * as Form from '@/components/ui/form/index.js';
	import * as Select from '@/components/ui/select/index.js';
	import { Input } from '@/components/ui/input';
	import { Button } from '@/components/ui/button';
	import { DynamicSchema } from '$schemas/digitaldash';

	// Default form data: empty conditions
	let data: SuperValidated<Infer<typeof DynamicSchema>> = {
		conditions: []
	} as any;
</script>
