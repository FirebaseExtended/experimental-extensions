const { exec } = require("child_process");
const { promisify } = require("util");
const fetch = require("node-fetch");
const prettier = require("prettier");

const EXTENSIONS_REGISTRY_PROD =
  "https://extensions-registry.firebaseapp.com/extensions.json";
const EXTENSIONS_REGISTRY_STAGING =
  "https://staging-extensions-registry.firebaseapp.com/extensions.json";

function getLatestSource(extensionName) {
  return fetch(EXTENSIONS_REGISTRY_PROD)
    .then(res => res.json())
    .then(registry => {
      const extensionMetadata = registry.mods[extensionName];

      if (!extensionMetadata) {
        throw new Error(
          `Could not find extension "${extensionName}" in registry`
        );
      }

      const latestVersion = extensionMetadata.labels.latest;
      return extensionMetadata.versions[latestVersion];
    });
}

function getExperimentalBlurb(extensionName, source) {
  return `

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?sourceName=${source})

### Firebase CLI

\`\`\`bash
firebase ext:install ${extensionName} --project=<your-project-id>
\`\`\`

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

`;
}

function runDefaultReadmeScript() {
  return promisify(exec)("firebase ext:info .. --markdown").then(result => {
    return result.stdout;
  });
}

async function generateReadme(extensionName) {
  const initialReadme = await runDefaultReadmeScript();
  const insertIndex = initialReadme.indexOf("**Details**:");

  const extensionSource = await getLatestSource(extensionName);

  const fullReadme =
    initialReadme.slice(0, insertIndex) +
    getExperimentalBlurb(extensionName, extensionSource) +
    initialReadme.slice(insertIndex);

  return prettier.format(fullReadme, { parser: "markdown" });
}

generateReadme(process.argv[2]).then(console.log);
