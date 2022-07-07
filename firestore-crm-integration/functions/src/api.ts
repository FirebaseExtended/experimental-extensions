import config from "./config";
import fetch from "node-fetch";
import { Octokit } from "octokit";

const { trello, github } = JSON.parse(config.providers);

export const trelloApi = async (url) => {
  return await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });
};

export const githubApi = async (props) => {
  const octokit = new Octokit({
    auth: props.token,
  });

  const {
    data: { login },
  } = await octokit.rest.users.getAuthenticated();

  console.log("Hello, %s", login);

  const { owner, repo, title, body } = props;
  await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body,
    assignees: ["dackers86"],
    labels: ["bug"],
  });
};
