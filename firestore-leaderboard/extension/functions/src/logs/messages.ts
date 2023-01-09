export const messages = {
  init: (config = {}) => [
    "Initializing extension with the parameter values",
    config,
  ],
  start: (config = {}) => [
    "Started execution of extension with configuration",
    config,
  ],
  scoreUpdate: () => "Score Entry updated",

  changeCreate: () => "changeCreate",
  changeDelete: () => "changeDelete",
  changeUpdate: () => "changeUpdate",

  complete: () => "onScoreUpdate Complete",
  error: (err: Error) => ["Failed execution of extension", err],
  documentUpdateNoScoreChange: () =>
    "Document was changed but no score update, no processing is required",
};
