import { TermsOfServiceMetadata } from "./interface";
import { Acknowledgement } from "./interface";

export const termsConverter = {
  toFirestore(terms: TermsOfServiceMetadata): FirebaseFirestore.DocumentData {
    return {
      tosId: terms.tosId,
      link: terms.link,
      creationDate: terms.creationDate,
      allowList: terms?.allowList || [],
      noticeType: terms.noticeType,
    };
  },
  fromFirestore(
    snapshot: FirebaseFirestore.QueryDocumentSnapshot
  ): TermsOfServiceMetadata {
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
      status: ack?.status || "",
      creationDate: ack?.creationDate || "",
      acceptanceDate: ack?.acceptanceDate || "",
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
      status: data?.status || "",
      creationDate: data?.creationDate || "",
      acceptanceDate: data?.acceptanceDate || "",
      extensionId: data?.extensionId || "",
    };
  },
};
