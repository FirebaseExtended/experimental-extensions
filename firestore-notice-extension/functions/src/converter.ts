import { NoticeMetadata } from "./interface";
import { Acknowledgement, AcknowledgementStatus } from "./interface";

export const noticeConverter = {
  toFirestore(notice: NoticeMetadata): FirebaseFirestore.DocumentData {
    return {
      title: notice?.title || "",
      noticeId: notice.noticeId,
      link: notice.link,
      creationDate: notice.creationDate,
      allowList: notice?.allowList || [],
      noticeType: notice.noticeType || "",
      preferences: notice?.preferences || [],
    };
  },
  fromFirestore(
    snapshot: FirebaseFirestore.QueryDocumentSnapshot
  ): NoticeMetadata {
    const data = snapshot.data();

    return {
      title: data?.title || "",
      noticeId: data?.noticeId || "",
      link: data?.link || "",
      creationDate: data?.creationDate || "",
      allowList: data?.allowList || [],
      noticeType: data?.noticeType || "",
      preferences: data?.preferences || [],
    };
  },
};

export const acknowledgementConverter = {
  toFirestore(ack: Acknowledgement): FirebaseFirestore.DocumentData {
    return {
      noticeId: ack?.noticeId || "",
      noticeType: ack?.noticeType || "",
      creationDate: ack?.creationDate || "",
      acknowledgedDate: ack?.acknowledgedDate || null,
      unacknowledgedDate: ack?.unacknowledgedDate || null,
      status: ack?.status || AcknowledgementStatus.SEEN,
      extensionId: `${process.env.EXT_INSTANCE_ID}`,
      preferences: ack?.preferences || [],
    };
  },
  fromFirestore(
    snapshot: FirebaseFirestore.DocumentSnapshot
  ): Acknowledgement | {} {
    const ack = snapshot.data();

    return {
      noticeId: ack?.noticeId || "",
      noticeType: ack?.noticeType || "",
      creationDate: ack?.creationDate || "",
      acknowledgedDate: ack?.acknowledgedDate || null,
      unacknowledgedDate: ack?.unacknowledgedDate || null,
      status: ack?.status || AcknowledgementStatus.SEEN,
      extensionId: ack?.extensionId || "",
      preferences: ack?.preferences || [],
    };
  },
};
