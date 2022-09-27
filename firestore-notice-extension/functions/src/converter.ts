import { FieldValue, FirestoreDataConverter, WithFieldValue } from "firebase-admin/firestore";

import { Notice } from "./interface";
import { Acknowledgement } from "./interface";

export const noticeConverter: FirestoreDataConverter<Notice> = {
  toFirestore(notice: any): FirebaseFirestore.DocumentData {
    throw new Error("Creating a notice is not supported.");
  },
  fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot) {
    const data = snapshot.data();

    // TODO throw if data is invalid?
    return {
      id: snapshot.id,
      type: data.type,
      title: data.title,
      description: data.description,
      link: data.link,
      createdAt: data.createdAt,
      allowList: data.allowList || [],
    };
  },
};

export const acknowledgementConverter: FirestoreDataConverter<Acknowledgement> = {
  toFirestore(
    data: WithFieldValue<Acknowledgement>
  ): FirebaseFirestore.DocumentData {
    return {
      acknowledgedAt: FieldValue.serverTimestamp(),
      noticeId: data.noticeId,
      status: data.status,
      metadata: data.metadata,
    };
  },
  fromFirestore(snapshot: FirebaseFirestore.DocumentSnapshot) {
    const data = snapshot.data();

    // TODO validate
    return {
      id: snapshot.id,
      noticeId: data.noticeId,
      acknowledgedAt: data.acknowledgedAt,
      metadata: data.metadata || {},
      status: data.status,
    };
  },
};
