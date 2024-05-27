/*
 ** =================
 ** Utils - Variable Access
 ** =================
 */

/* Gets all the local variables */
let figmaVariables: Variable[] = [];
let availableCollections: Record<string, string> = {};
let selectedCollection: string;
let availableModes: Record<string, string> = {};
let selectedMode: string;

async function initVariables(): Promise<void> {
	figmaVariables = await figma.variables.getLocalVariablesAsync();
	availableCollections = await listAllCollections(figmaVariables);
	selectedCollection = Object.keys(availableCollections)[0];
	availableModes = await modesOfCollection(selectedCollection);
	selectedMode = Object.keys(availableModes)[0];
}

function variableByCurrentMode(variable: Variable): VariableValue {
	if (selectedMode === null) {
		throw new Error('No mode selected');
	}
	return variable.valuesByMode[selectedMode];
}

async function listAllCollections(
	variables: Variable[]
): Promise<Record<string, string>> {
	const collections: Record<string, string> = {};
	for (const variable of variables) {
		const collectionId = variable.variableCollectionId;
		const collection =
			await figma.variables.getVariableCollectionByIdAsync(collectionId);
		collections[collectionId] = collection?.name ?? collectionId;
	}
	return collections;
}

async function modesOfCollection(
	collectionId: string
): Promise<Record<string, string>> {
	const modes: Record<string, string> = {};
	const collection =
		await figma.variables.getVariableCollectionByIdAsync(collectionId);
	collection?.modes.forEach((mode) => {
		modes[mode.modeId] = mode.name;
	});
	return modes;
}

/*
 ** =================
 ** Utils - Maths
 ** =================
 */

/*
 ** Converts a rgba color to hex
 */
function rgba2hex(orig: any) {
	let a;
	const rgb = orig
			.replace(/\s/g, '')
			.match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
		alpha = ((rgb && rgb[4]) || '').trim();
	let hex = rgb
		? (rgb[1] | (1 << 8)).toString(16).slice(1) +
			(rgb[2] | (1 << 8)).toString(16).slice(1) +
			(rgb[3] | (1 << 8)).toString(16).slice(1)
		: orig;

	if (alpha !== '') {
		a = alpha;
	} else {
		a = 0o1;
	}
	a = ((a * 255) | (1 << 8)).toString(16).slice(1);
	hex = hex + a;

	return '#' + hex.toUpperCase();
}

/*
 ** Converts a rgba JavaScript object to a CSS hexa string
 */
function rgbaObjectToCSSHexaString(obj: {
	r: number;
	g: number;
	b: number;
	a: number;
}): string {
	const { r, g, b, a } = obj;
	const rgbaString = rgba2hex(
		`rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
			b * 255
		)}, ${a})`
	);
	return rgbaString;
}

/*
 ** =================
 ** Utils - Converters
 ** =================
 */

/*
 ** Converts a rgba JavaScript object to a Compose hexa string
 */
function rgbaObjectToComposeHexaString(obj: {
	r: number;
	g: number;
	b: number;
	a: number;
}): string {
	const { r, g, b, a } = obj;
	const rgbaString = rgba2hex(
		`rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
			b * 255
		)}, ${a})`
	);
	return `Color(Ox${rgbaString.substring(7)}${rgbaString.substring(1, 7)})`;
}

/*
 ** Converts a rgba JavaScript object to a SwiftUI hexa string
 */
function rgbaObjectToSwiftuiRgbaString(obj: {
	r: number;
	g: number;
	b: number;
	a: number;
}): string {
	const { r, g, b, a } = obj;
	return `Color(red: ${r.toFixed(2)}, green: ${g.toFixed(2)}, blue: ${b.toFixed(
		2
	)})${a !== 1 ? `.opacity(${a.toFixed(2)})` : ''}`;
}

/*
 ** Converts a CSS property to camelCase
 */
function cssPropertyToCamelCase(cssProperty: string): string {
	const matches = cssProperty.match(/--(\w+(-\w+)*)/);
	if (matches && matches.length > 1) {
		const propertyName = matches[1];
		return propertyName.replace(/-(.)/g, (_, letter) => letter.toUpperCase());
	}
	return '';
}

/*
 ** Converts a CSS property to JavaScript const
 */
function cssPropertyToJSConst(propertyString: string): string {
	propertyString = propertyString.trim();

	const matches = propertyString.match(/--(.+):\s*(.+);/);
	if (!matches || matches.length !== 3) {
		throw new Error('Invalid CSS property string');
	}

	const propertyName = matches[1];
	let propertyValue = matches[2];

	if (propertyValue.startsWith('var(--')) {
		propertyValue = cssPropertyToCamelCase(propertyValue);
	} else {
		propertyValue = `'${propertyValue}'`;
	}

	const camelCaseName = propertyName.replace(/-(\w)/g, (_, letter) =>
		letter.toUpperCase()
	);
	const jsConstantString = `export const ${camelCaseName} = ${propertyValue};`;

	return jsConstantString;
}

/*
 ** =================
 ** Utils - Generators
 ** =================
 */

/*
 ** Generates a CSS key string
 */
function generatesCSSKeyString(variable: Variable): string {
	return (
		'--' +
		variable.name
			.replace(/\//g, '-')
			.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
			.toLowerCase()
	);
}

/*
 ** Generates a CSS value string
 */
function generatesCSSValueString(variable: Variable): string {
	const value: any = variableByCurrentMode(variable);

	if (value.type === 'VARIABLE_ALIAS') {
		const alias = <Variable>figmaVariables.find((obj) => obj.id === value.id);
		return `var(${generatesCSSKeyString(alias)})`;
	} else if (variable.resolvedType === 'COLOR') {
		return rgbaObjectToCSSHexaString(value);
	} else {
		return value + 'px';
	}
}

/*
 ** Generates a Compose key string
 */
function generatesComposeKeyString(variable: Variable): string {
	const parts = variable.name.split('/');
	let transformedString = '';

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i].trim();
		const capitalizedPart = part.charAt(0).toUpperCase() + part.slice(1);
		transformedString += capitalizedPart;
	}

	return transformedString;
}

/*
 ** Generates a Compose value string
 */
function generatesComposeValueString(variable: Variable): string {
	const value: any = variableByCurrentMode(variable);
	if (value.type === 'VARIABLE_ALIAS') {
		const alias = <Variable>figmaVariables.find((obj) => obj.id === value.id);
		return `Variables.${generatesComposeKeyString(alias)}`;
	} else if (variable.resolvedType === 'COLOR') {
		return rgbaObjectToComposeHexaString(value);
	} else {
		return value + '.dp';
	}
}

/*
 ** Generates a SwiftUI key string
 */
function generatesSwiftuiKeyString(variable: Variable): string {
	const parts = variable.name.split('/');
	let transformedString = '';

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i].trim();
		const capitalizedPart = part.charAt(0).toUpperCase() + part.slice(1);
		transformedString += capitalizedPart;
	}

	return transformedString;
}

/*
 ** Generates a SwiftUI value string
 */
function generatesSwiftuiValueString(variable: Variable): string {
	const value: any = variableByCurrentMode(variable);
	if (value.type === 'VARIABLE_ALIAS') {
		const alias = <Variable>figmaVariables.find((obj) => obj.id === value.id);
		return `Constants.${generatesComposeKeyString(alias)}`;
	} else if (variable.resolvedType === 'COLOR') {
		return rgbaObjectToSwiftuiRgbaString(value);
	} else {
		return value;
	}
}

/*
 ** =================
 ** Figma plugin
 ** =================
 */

/* Shows the Figma UI in the sidebar */
figma.showUI(__html__);

function postUiUpdate() {
	/* Prepare variables for code generation */
	let cssFile = ':root {\n';
	let jsFile = '';
	let composeFile = 'object Variables {\n';
	let swiftuiFile = 'struct Constants {\n';

	const variablesForCurrentMode = figmaVariables
		.filter((variable) => variable.variableCollectionId === selectedCollection)
		.filter(
			(variable) => variable.valuesByMode[selectedMode ?? ''] !== undefined
		);
	/* Filters variables to only get COLOR & FLOAT resolved types sorted alphabetically */
	const filteredFigmaVariables = variablesForCurrentMode
		.filter(
			(variable) =>
				variable.resolvedType === 'COLOR' || variable.resolvedType === 'FLOAT'
		)
		.sort((a, b) => a.name.localeCompare(b.name));

	/* Iterates through variables to generate CSS & JS variables */
	filteredFigmaVariables
		.map(
			(variable) =>
				`  ${generatesCSSKeyString(variable)}: ${generatesCSSValueString(
					variable
				)};`
		)
		.forEach((variable) => {
			cssFile += variable + '\n';
			jsFile += cssPropertyToJSConst(variable) + '\n';
		});
	cssFile += '}';

	/* Iterates through variables to generate Compose variables */
	filteredFigmaVariables
		.map(
			(variable) =>
				`  val ${generatesComposeKeyString(variable)}: ${
					variable.resolvedType === 'COLOR' ? 'Color' : 'Dp'
				} = ${generatesComposeValueString(variable)}`
		)
		.forEach((variable) => {
			composeFile += variable + '\n';
		});
	composeFile += '}';

	/* Iterates through variables to generate Compose variables */
	filteredFigmaVariables
		.map(
			(variable) =>
				`  static let ${generatesSwiftuiKeyString(variable)}: ${
					variable.resolvedType === 'COLOR' ? 'Color' : 'CGFloat'
				} = ${generatesSwiftuiValueString(variable)}`
		)
		.forEach((variable) => {
			swiftuiFile += variable + '\n';
		});
	swiftuiFile += '}';

	/* Sends new data to UI (index.html) */
	figma.ui.postMessage({
		cssFile,
		jsFile,
		composeFile,
		swiftuiFile,
		collections: availableCollections,
		modes: availableModes,
	});
}

async function init() {
	await initVariables();
	postUiUpdate();
}
init();

/* Handle ui events triggered from UI (index.html) */
figma.ui.onmessage = async (message) => {
	if (message.type === 'code-copied-css') {
		figma.notify('CSS variables successfully copied to clipboard');
	}
	if (message.type === 'code-copied-js') {
		figma.notify('JavaScript variables successfully copied to clipboard');
	}
	if (message.type === 'code-copied-compose') {
		figma.notify('Compose variables successfully copied to clipboard');
	}
	if (message.type === 'code-copied-swiftui') {
		figma.notify('SwiftUI variables successfully copied to clipboard');
	}
	if (message.type === 'collection-selected') {
		selectedCollection = message.value;
		if (selectedCollection === null) {
			throw new Error('No collection selected');
		}
		availableModes = await modesOfCollection(selectedCollection);
		selectedMode = Object.keys(availableModes)[0];
		postUiUpdate();
	}
	if (message.type === 'mode-selected') {
		selectedMode = message.value;
		postUiUpdate();
	}
};
