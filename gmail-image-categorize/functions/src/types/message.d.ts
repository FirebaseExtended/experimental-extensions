import { GaxiosResponse } from "gaxios";
import { gmail_v1 } from "googleapis";

export type Message = GaxiosResponse<gmail_v1.Schema$Message>;
