import { ICRMProvider } from "../interface";
import config from "../config";
import fetch from "node-fetch";

const { trello = {} } = JSON.parse(config.providers || "{}");

export class TrelloProvider implements ICRMProvider {
  host: string;
  idList: string;
  name: string;
  description: string;
  key: string;
  token: string;

  constructor() {
    this.host = trello.host;
    this.idList = trello.idList;
    this.name = trello.name;
    this.description = trello.description;
    this.key = trello.key;
    this.token = trello.token;
  }

  private Api = async (type, method, body = null) => {
    const url = `${this.host}/${type}?&key=${this.key}&token=${this.token}`;

    const req = {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    //@ts-ignore
    if (body) req.body = JSON.stringify(body);

    const resp = await fetch(url, req);
    return resp.json();
  };

  public async create(card) {
    return this.Api("cards", "POST", {
      ...card,
      idList: this.idList,
    });
  }

  public async delete(id) {
    return this.Api(`cards/${id}`, "DELETE");
  }

  public async list() {
    return this.Api(`lists/${this.idList}/cards`, "GET", null);
  }
}
