import { firestore } from "firebase-admin";

export interface Notice {
  // The document ID.
  id: string;
  // The type of notice, e.g. `banner` | `terms-and-condition` | `privacy-policy`.
  type: string;
  // An optional notice version. This can be used to filter a specific notice versions via the `getNotice` callable function.
  version?: number;
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

type BaseAcknowledgement = {
  // The document ID.
  id: string;
  // The UID of the user who acknowledged the notice.
  userId: string;
  // The ID of the notice that was acknowledged.
  noticeId: string;
  // The timestamp when the notice was acknowledged.
  createdAt: firestore.Timestamp;
  // The optional metadata of the acknowledgement.
  metadata: any;
};

export type Acknowledgement =
  | (BaseAcknowledgement & {
      // The event type of the acknowledgement.
      event: "acknowledgement";
      // The type of the acknowledgement. Defaults to `seen`.
      type: string;
    })
  | (BaseAcknowledgement & {
      // The event type of the acknowledgement.
      event: "unacknowledgement";
    });