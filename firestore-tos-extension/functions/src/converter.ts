import { NoticeMetadata } from "./interface";
import { Acknowledgement, AcknowledgementStatus } from "./interface";

export const noticeConverter = {
  toFirestore(notice: NoticeMetadata): FirebaseFirestore.DocumentData {
    return {
      noticeId: notice.noticeId,
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
      noticeId: data?.noticeId || "",
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
      noticeId: ack?.noticeId || "",
      noticeType: ack?.noticeType || [],
      creationDate: ack?.creationDate || "",
      acknowledgedDate: ack?.acknowledgedDate || null,
      unacknowledgedDate: ack?.unacknowledgedDate || null,
      status: ack?.status || AcknowledgementStatus.SEEN,
      extensionId: `${process.env.EXT_INSTANCE_ID}`,
    };
  },
  fromFirestore(
    snapshot: FirebaseFirestore.DocumentSnapshot
  ): Acknowledgement | {} {
    const ack = snapshot.data();

    return {
      noticeId: ack?.noticeId || "",
      noticeType: ack?.noticeType || [],
      creationDate: ack?.creationDate || "",
      acknowledgedDate: ack?.acknowledgedDate || null,
      unacknowledgedDate: ack?.unacknowledgedDate || null,
      status: ack?.status || AcknowledgementStatus.SEEN,
      extensionId: ack?.extensionId || "",
    };
  },
};
