# variables-converter-figma-plugin

> Figma Plugin that generates CSS Custom Properties & JS variables from your Figma variables

## Install

Below are the steps to get your plugin running. You can also find instructions at: https://www.figma.com/plugin-docs/plugin-quickstart-guide/

This plugin template uses Typescript and NPM, two standard tools in creating JavaScript applications.

First, download Node.js which comes with NPM. This will allow you to install TypeScript and other
libraries. You can find the download link here: https://nodejs.org/en/download/

Then, install dependencies:

```sh
npm install
```

## Develop

To develop, we encourage you to use the watch mode by lauching:

```sh
npm run build:watch
```

Then, go to Figma, open a design file, activate the "Dev Mode", go to "Plugins" tab, select "Development" in the dropdown, click on the "+ button" and "Import plugin from manifest". You just need to target the `manifest.json` file at the root of this project. Finally, click on "Run" button aside "Variables Converter".

## Build

To build the plugin for production, just launch:

```sh
npm run build:watch
```

## Recommended configuration

We recommend writing TypeScript code using Visual Studio code:

1. Download Visual Studio Code if you haven't already: https://code.visualstudio.com/.
2. Open this directory in Visual Studio Code.
3. Compile TypeScript to JavaScript: Run the "Terminal > Run Build Task..." menu item,
    then select "npm: build:watch". You will have to do this again every time
    you reopen Visual Studio Code.

That's it! Visual Studio Code will regenerate the JavaScript file every time you save.

## License

    Copyright 2023 Laurent Thiebault.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
