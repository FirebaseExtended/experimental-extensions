import { Octokit } from "octokit";
import { ICRMProvider } from "../interface";
import config from "../config";

const { github = {} } = JSON.parse(config.providers || "{}");

const octokit = new Octokit({
  auth: github.token,
});

export class GithubProvider implements ICRMProvider {
  owner: string;
  repo: string;

  constructor() {
    this.owner = github.owner;
    this.repo = github.repo;
  }

  public async create(issue): Promise<void> {
    const { name: title, description: body } = issue;
    await octokit.rest.issues.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body,
      assignees: ["dackers86"],
      labels: ["bug"],
    });

    return Promise.resolve();
  }

  public async delete(issue_number) {
    return octokit
      .request("PATCH /repos/{owner}/{repo}/issues/{issue_number}", {
        owner: this.owner,
        repo: this.repo,
        issue_number,
        state: "closed",
      })
      .then(($) => Promise.resolve());
  }

  public async list(status = "open") {
    return octokit
      .request("GET /repos/{owner}/{repo}/issues", {
        owner: this.owner,
        repo: this.repo,
        status,
      })
      .then(($) => $.data);
  }
}
