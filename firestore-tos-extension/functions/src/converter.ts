import { NoticeMetadata } from "./interface";
import { Acknowledgement } from "./interface";

export const noticeConverter = {
  toFirestore(notice: NoticeMetadata): FirebaseFirestore.DocumentData {
    return {
      tosId: notice.tosId,
      link: notice.link,
      creationDate: notice.creationDate,
      allowList: notice?.allowList || [],
      noticeType: notice.noticeType,
    };
  },
  fromFirestore(
    snapshot: FirebaseFirestore.QueryDocumentSnapshot
  ): NoticeMetadata {
    const data = snapshot.data();

    return {
      tosId: data?.tosId || "",
      link: data?.link || "",
      creationDate: data?.creationDate || "",
      allowList: data?.allowList || [],
      noticeType: data?.noticeType || [],
    };
  },
};

export const acknowledgementConverter = {
  toFirestore(ack: Acknowledgement): FirebaseFirestore.DocumentData {
    return {
      tosId: ack?.tosId || "",
      noticeType: ack?.noticeType || [],
      acknowledged: ack?.acknowledged || false,
      creationDate: ack?.creationDate || "",
      acknowledgedDate: ack?.acknowledgedDate || null,
      unacknowledgedDate: ack?.unacknowledgedDate || null,
      extensionId: `${process.env.EXT_INSTANCE_ID}`,
    };
  },
  fromFirestore(
    snapshot: FirebaseFirestore.DocumentSnapshot
  ): Acknowledgement | {} {
    const data = snapshot.data();

    return {
      tosId: data?.tosId || "",
      noticeType: data?.noticeType || [],
      acknowledged: data?.acknowledged || false,
      creationDate: data?.creationDate || "",
      acknowledgedDate: data?.acknowledgedDate || null,
      unacknowledgedDate: data?.unacknowledgedDate || null,
      extensionId: data?.extensionId || "",
    };
  },
};
