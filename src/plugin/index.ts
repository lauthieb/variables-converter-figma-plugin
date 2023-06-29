/*
** =================
** Utils - Converters
** =================
*/

/*
** Converts a rgba JavaScript object to a CSS hexa string
*/
function rgbaObjectToCSSHexaString(obj: { r: number, g: number, b: number, a: number }): string {
  const { r, g, b, a } = obj;
  const rgbaString = rgba2hex(`rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`);
  return rgbaString;
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
** Converts a CSS property to JavaScript property
*/
function cssPropertyToJSProperty(propertyString: string): string {
  propertyString = propertyString.trim();

  const matches = propertyString.match(/--(.+):\s*(.+);/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid CSS property string');
  }

  let propertyName = matches[1];
  let propertyValue = matches[2];

  if (propertyValue.startsWith('var(--')) {
    propertyValue = cssPropertyToCamelCase(propertyValue);
  } else {
    propertyValue = `'${propertyValue}'`;
  }

  const camelCaseName = propertyName.replace(/-(\w)/g, (_, letter) => letter.toUpperCase());
  const jsConstantString = `export const ${camelCaseName} = ${propertyValue};`;

  return jsConstantString;
}

/*
** Converts a CSS property to JavaScript property
*/
function rgba2hex(orig: any) {
  let a,
    rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
    alpha = (rgb && rgb[4] || "").trim(),
    hex = rgb ?
    (rgb[1] | 1 << 8).toString(16).slice(1) +
    (rgb[2] | 1 << 8).toString(16).slice(1) +
    (rgb[3] | 1 << 8).toString(16).slice(1) : orig;

  if (alpha !== "") {
    a = alpha;
  } else {
    a = 0o1;
  }
  a = ((a * 255) | 1 << 8).toString(16).slice(1)
  hex = hex + a;

  return '#' + hex.toUpperCase();
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
  return '--' + variable.name.replace(/\//g, "-").replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/*
** Generates a CSS value string
*/
function generatesCSSValueString(variable: Variable): string {
  const value: any = variable.valuesByMode[Object.keys(variable.valuesByMode)[0]];

  if (value.type === 'VARIABLE_ALIAS') {
    const alias = <Variable> figmaVariables.find(obj => obj.id === value.id);
    return `var(${generatesCSSKeyString(alias)})`;
  } else if (variable.resolvedType === 'COLOR') {
    return rgbaObjectToCSSHexaString(value);
  } else {
    return value + 'px';
  }
};

/*
** =================
** Figma plugin
** =================
*/

/* Shows the Figma UI in the sidebar */
figma.showUI(__html__);

/* Prepare variables for code generation */
let cssFile = `:root {\n`;
let jsFile = '';

/* Gets all the local variables */
const figmaVariables = figma.variables.getLocalVariables();

/* Iterates through variables to generate CSS & JS variables */
figmaVariables
  .filter(variable => variable.resolvedType === 'COLOR' || variable.resolvedType === 'FLOAT')
  .map(variable => `  ${generatesCSSKeyString(variable)}: ${generatesCSSValueString(variable)};`)
  .forEach(property => {
    cssFile += property + '\n';
    jsFile += cssPropertyToJSProperty(property) + '\n';
  });

cssFile += '}';

/* Sends to the UI the code generation */
figma.ui.postMessage({ cssFile, jsFile });

/* Catches event when code copied to clipboard and notify the user */
figma.ui.onmessage = message => {
  if (message.type === 'code-copied-css') {
    figma.notify('CSS code successfully copied to clipboard')
  }
  if (message.type === 'code-copied-js') {
    figma.notify('JS code successfully copied to clipboard')
  }
};
