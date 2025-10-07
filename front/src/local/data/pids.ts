/**
 * PID (Parameter ID) Definitions
 *
 * This file contains all the standardized PID definitions used throughout the application.
 * Each PID defines a measurable parameter with its units, ranges, and display properties.
 */

export interface PIDDefinition {
	desc: string;
	label: string;
	units: string[];
	min: number[];
	max: number[];
	decimals: number[];
}

export const PID_DEFINITIONS: PIDDefinition[] = [
	{
		desc: 'Commanded Air to Fuel Ratio',
		label: 'Cmd AFR',
		units: ['Ratio'],
		min: [0],
		max: [29.4],
		decimals: [2]
	},
	{
		desc: 'Calculated engine load',
		label: 'Engine Load',
		units: ['Percent'],
		min: [0],
		max: [100],
		decimals: [1]
	},
	{
		desc: 'Engine coolant temperature',
		label: 'ECT',
		units: ['Celsius', 'Fahrenheit'],
		min: [-40, -40],
		max: [215, 400],
		decimals: [0, 1]
	},
	{
		desc: 'Short term fuel trim - Bank 1',
		label: 'STFT1',
		units: ['Percent'],
		min: [-100],
		max: [99.2],
		decimals: [1]
	},
	{
		desc: 'Long term fuel trim - Bank 1',
		label: 'LTFT1',
		units: ['Percent'],
		min: [-100],
		max: [99.2],
		decimals: [1]
	},
	{
		desc: 'Short term fuel trim - Bank 2',
		label: 'STFT2',
		units: ['Percent'],
		min: [-100],
		max: [99.2],
		decimals: [0]
	},
	{
		desc: 'Long term fuel trim - Bank 2',
		label: 'LTFT2',
		units: ['Percent'],
		min: [-100],
		max: [99.2],
		decimals: [0]
	},
	{
		desc: 'Fuel Pressure',
		label: 'Fuel Pressure',
		units: ['kPa', 'psi'],
		min: [0, 0],
		max: [765, 110],
		decimals: [0, 1]
	},
	{
		desc: 'Intake manifold absolute pressure',
		label: 'MAP',
		units: ['kPa', 'psi'],
		min: [0, 0],
		max: [255, 36],
		decimals: [0, 1]
	},
	{ desc: 'Engine speed', label: 'RPM', units: ['rpm'], min: [0], max: [8000], decimals: [0] },
	{
		desc: 'Vehicle speed',
		label: 'Speed',
		units: ['km/h', 'mph'],
		min: [0, 0],
		max: [270, 180],
		decimals: [0, 0]
	},
	{
		desc: 'Timing advance',
		label: 'Timing',
		units: ['Degrees'],
		min: [-64],
		max: [63.5],
		decimals: [1]
	},
	{
		desc: 'Intake air temperature',
		label: 'IAT',
		units: ['Celsius', 'Fahrenheit'],
		min: [-40, -40],
		max: [200, 400],
		decimals: [0, 1]
	},
	{
		desc: 'Mass air flow sensor air flow rate',
		label: 'MAF',
		units: ['Grams/sec'],
		min: [0],
		max: [655.35],
		decimals: [0]
	},
	{
		desc: 'Throttle position',
		label: 'Throttle',
		units: ['Percent'],
		min: [0],
		max: [100],
		decimals: [1]
	},
	{
		desc: 'Oxygen Sensor 2 Voltage',
		label: 'O2',
		units: ['Volts'],
		min: [0],
		max: [1.275],
		decimals: [2]
	},
	{
		desc: 'Fuel Rail Pressure relative to manifold vacuum',
		label: 'Fuel Rail',
		units: ['kPa', 'psi'],
		min: [0, 0],
		max: [5177, 750],
		decimals: [0, 0]
	},
	{
		desc: 'Absolute barometric pressure',
		label: 'Baro',
		units: ['kPa', 'psi'],
		min: [0, 0],
		max: [255, 36],
		decimals: [0, 1]
	},
	{
		desc: 'Air to Fuel Ratio',
		label: 'AFR',
		units: ['Ratio'],
		min: [0],
		max: [29.4],
		decimals: [2]
	},
	{
		desc: 'Relative accelerator pedal position',
		label: 'APP',
		units: ['Percent'],
		min: [0],
		max: [100],
		decimals: [0]
	},
	{
		desc: 'Engine oil temperature',
		label: 'Oil Temp',
		units: ['Celsius', 'Fahrenheit'],
		min: [-40, -40],
		max: [200, 400],
		decimals: [0, 1]
	},
	{
		desc: 'Turbocharger compressor inlet pressure',
		label: 'Boost',
		units: ['kPa', 'psi'],
		min: [0, 0],
		max: [255, 36],
		decimals: [1, 2]
	},
	{ desc: 'Lateral G', label: 'Lat G', units: ['G-Force'], min: [-1], max: [1], decimals: [2] },
	{
		desc: 'Longitude G',
		label: 'Long G',
		units: ['G-Force'],
		min: [-1],
		max: [1],
		decimals: [2]
	},
	{
		desc: 'Manifold Absolute Pressure Sensor Voltage 1',
		label: 'MAP Voltage',
		units: ['Volts'],
		min: [0],
		max: [5],
		decimals: [2]
	},
	{
		desc: 'Low Pressure Fuel Pump Commanded Duty Cycle',
		label: 'LPFP DC',
		units: ['Percent'],
		min: [0],
		max: [100],
		decimals: [0]
	},
	{
		desc: 'Ignition Correction Cylinder 1',
		label: 'IGN 1',
		units: ['Degrees'],
		min: [-16],
		max: [16],
		decimals: [2]
	},
	{
		desc: 'VCT Intake Cam Solenoid Duty Cycle',
		label: 'VCT Int DC',
		units: ['Percent'],
		min: [0],
		max: [100],
		decimals: [1]
	},
	{
		desc: 'VCT Exhaust Cam Solenoid Duty Cycle',
		label: 'VCT Exh DC',
		units: ['Percent'],
		min: [0],
		max: [100],
		decimals: [1]
	},
	{
		desc: 'Charge air temperature',
		label: 'CAT',
		units: ['Celsius', 'Fahrenheit'],
		min: [-40, -40],
		max: [200, 400],
		decimals: [1, 2]
	},
	{
		desc: 'Manifold charge temperature',
		label: 'MCT',
		units: ['Celsius', 'Fahrenheit'],
		min: [-40, -40],
		max: [200, 400],
		decimals: [0, 1]
	},
	{
		desc: 'Octane Adjust Ratio',
		label: 'OAR',
		units: ['Ratio'],
		min: [-1],
		max: [1],
		decimals: [2]
	},
	{
		desc: 'Ambient air temperature',
		label: 'AAT',
		units: ['Celsius', 'Fahrenheit'],
		min: [-40, -40],
		max: [200, 400],
		decimals: [0, 1]
	},
	{
		desc: 'Engine load percentage',
		label: 'Load Percent',
		units: ['Percent'],
		min: [0],
		max: [100],
		decimals: [1]
	},
	{
		desc: 'Catalytic Temperature',
		label: 'Cat Temp',
		units: ['Celsius', 'Fahrenheit'],
		min: [0, 0],
		max: [1000, 2000],
		decimals: [0, 0]
	},
	{
		desc: 'Gauge Brightness',
		label: 'Brightness',
		units: ['None'],
		min: [0],
		max: [31],
		decimals: [0]
	},
	{ desc: 'Vehicle Status', label: 'Status', units: ['None'], min: [0], max: [1], decimals: [0] },
	{
		desc: 'Brake Pedal Status',
		label: 'Brake Pedal',
		units: ['None'],
		min: [0],
		max: [1],
		decimals: [0]
	},
	{
		desc: 'Emergency Brake Status',
		label: 'E-Brake',
		units: ['None'],
		min: [0],
		max: [1],
		decimals: [0]
	},
	{
		desc: 'Reverse Status',
		label: 'Reverse',
		units: ['None'],
		min: [0],
		max: [1],
		decimals: [0]
	},
	{
		desc: 'Cruise Control ON button',
		label: 'ON Button',
		units: ['None'],
		min: [0],
		max: [1],
		decimals: [0]
	},
	{
		desc: 'Cruise Control OFF button',
		label: 'OFF Button',
		units: ['None'],
		min: [0],
		max: [1],
		decimals: [0]
	},
	{
		desc: 'Cruise Control OFF button Toggle',
		label: 'OFF Toggle',
		units: ['None'],
		min: [0],
		max: [1],
		decimals: [0]
	},
	{
		desc: 'Cruise Control SET plus button',
		label: 'SET+ Button',
		units: ['None'],
		min: [0],
		max: [1],
		decimals: [0]
	},
	{
		desc: 'Cruise Control SET minus button',
		label: 'SET- Button',
		units: ['None'],
		min: [0],
		max: [1],
		decimals: [0]
	},
	{
		desc: 'Cruise Control RES button',
		label: 'RES Button',
		units: ['None'],
		min: [0],
		max: [1],
		decimals: [0]
	},
	{
		desc: 'Cruise Control CAN button',
		label: 'CAN Button',
		units: ['None'],
		min: [0],
		max: [1],
		decimals: [0]
	},
	{
		desc: 'Turbocharger compressor inlet pressure with vacuum range',
		label: 'Boost/Vacuum',
		units: ['kPa', 'psi'],
		min: [-82, -12],
		max: [170, 24],
		decimals: [1, 2]
	},
	{
		desc: 'Lateral Acceleration',
		label: 'Lat Accel',
		units: ['G-Force'],
		min: [0],
		max: [2],
		decimals: [2]
	},
	{
		desc: 'Longitudinal Acceleration',
		label: 'Long Accel',
		units: ['G-Force'],
		min: [0],
		max: [2],
		decimals: [2]
	}
];
