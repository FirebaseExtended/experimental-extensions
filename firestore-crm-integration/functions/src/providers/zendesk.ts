import { ICRMProvider } from "../interface";
import config from "../config";
import fetch from "node-fetch";

const { zendesk = {} } = JSON.parse(config.providers || "{}");

export class ZendeskProvider implements ICRMProvider {
  subdomain: string;
  email: string;
  password: string;
  authToken: string;

  constructor() {
    this.subdomain = zendesk.subdomain;
    this.email = zendesk.email;
    this.password = zendesk.password;
    this.authToken = Buffer.from(`${this.email}:${this.password}`).toString(
      "base64"
    );
  }

  private Api = async (type, method, body = null) => {
    const url = `https://${this.subdomain}.zendesk.com/api/v2/${type}.json`;
    const Authorization = `Basic ${this.authToken}`;

    const req = {
      method,
      headers: {
        Authorization,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    //@ts-ignore
    if (body) req.body = JSON.stringify(body);

    return fetch(url, req)
      .then((response) => {
        return response.text();
      })
      .then((data) => {
        return data ? JSON.parse(data) : {};
      });
  };

  public async create(ticket) {
    return this.Api("tickets", "POST", {
      ticket: {
        comment: {
          body: ticket.description,
        },
      },
    });
  }

  public async delete(id) {
    return this.Api(`tickets/${id}`, "DELETE");
  }

  public async list() {
    return this.Api("tickets", "GET").then((resp) => {
      return resp.tickets;
    });
  }
}
