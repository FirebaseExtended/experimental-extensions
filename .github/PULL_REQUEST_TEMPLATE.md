Welcome to the Experimental Extensions repo! If this PR adds a new extension,
thank you, and please make sure you follow the steps below! Otherwise, you can
disregard this message.

- [ ] The new extension's id roughly follows the pattern
      `[firebase-product]-[action]-[noun]`, like `storage-resize-images`
- [ ] The following match the extension's id:
  - [ ] The folder that contains the extension (`my-new-extension/`)
  - [ ] The `name` field of `my-new-extension/functions/package.json`
  - [ ] The `name` field of `my-new-extension/extension.yaml`
  - [ ] A new entry in the `packages` array of the `lerna.json` file in the
        repository's root
- [ ] I've added a `generate-readme` script to
      `my-new-extension/functions/package.json` that matches the other
      extensions in the repository
- [ ] I've run the following npm commands at the root of the repository:
  - [ ] `npm install`
  - [ ] `npm run generate-readmes`
  - [ ] `npm run format`
