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
    const obj = {};

    Object.entries(ack).forEach(([key, value]) => {
      obj[key] = {
        tosId: value?.tosId || "",
        noticeType: value?.noticeType || [],
        status: value?.status || "",
        creationDate: value?.creationDate || "",
        acceptanceDate: value?.acceptanceDate || "",
      };
    });

    return obj;
  },
  fromFirestore(
    snapshot: FirebaseFirestore.DocumentSnapshot
  ): Acknowledgement | {} {
    const data = snapshot.data();

    const obj = {};

    Object.entries(data).forEach(([key, value]) => {
      obj[key] = {
        tosId: value?.tosId || "",
        noticeType: value?.noticeType || [],
        status: value?.status || "",
        creationDate: value?.creationDate || "",
        acceptanceDate: value?.acceptanceDate || "",
      };
    });

    return obj;
  },
};
