/**
 * A script to generate a special readme. Example use:
 *
 * node ../../generate-experimental-readme.js storage-image-labeling > ../README.md
 */

const { exec } = require("child_process");
const { promisify } = require("util");
const prettier = require("prettier");

function getExperimentalBlurb(extensionId) {
  return `

---

## 🧩 Install this experimental extension

> ⚠️ **Experimental**: This extension is available for testing as an _experimental_ release. It has not been as thoroughly tested as the officially released extensions, and future updates might introduce breaking changes. If you use this extension, please [report bugs and make feature requests](https://github.com/firebase/experimental-extensions/issues/new/choose) in our GitHub repository.

### Console

[![Install this extension in your Firebase project](../install-extension.png?raw=true "Install this extension in your Firebase project")](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/${extensionId})

### Firebase CLI

\`\`\`bash
firebase ext:install firebase/${extensionId} --project=<your-project-id>
\`\`\`

> Learn more about installing extensions in the Firebase Extensions documentation: [console](https://firebase.google.com/docs/extensions/install-extensions?platform=console), [CLI](https://firebase.google.com/docs/extensions/install-extensions?platform=cli)

---

`;
}

function runDefaultReadmeScript() {
  return promisify(exec)("firebase ext:info .. --markdown").then((result) => {
    return result.stdout;
  });
}

async function generateReadme(extensionName) {
  const initialReadme = await runDefaultReadmeScript();
  const insertIndex = initialReadme.indexOf("**Details**:");

  const fullReadme =
    initialReadme.slice(0, insertIndex) +
    getExperimentalBlurb(extensionName) +
    initialReadme.slice(insertIndex);

  return prettier.format(fullReadme, { parser: "markdown" });
}

generateReadme(process.argv[2]).then(console.log);
