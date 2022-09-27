import { firestore } from "firebase-admin";

export interface Notice {
  // The document ID.
  id: string;
  // The type of notice, e.g. `banner` | `terms-and-condition` | `privacy-policy`.
  type: string;
  // The optional title of the notice.
  title?: string;
  // The optional description of the notice.
  description?: string;
  // The optional link of the notice.
  link?: string;
  // The timestamp when the notice was created.
  createdAt: firestore.Timestamp;
  // A list of user IDs that are allowed to see the notice.
  allowList: string[];
}

export enum AcknowledgementStatus {
  SEEN = "seen",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

export interface Acknowledgement {
  id: string;
  noticeId: string;
  acknowledgedAt: firestore.Timestamp;
  status: AcknowledgementStatus;
  metadata: any;
}
