import * as admin from "firebase-admin";
import { TermsOfServiceMetadata } from "./interface";

export const convertToTerms = (
  doc: admin.firestore.DocumentData
): TermsOfServiceMetadata => {
  return {
    tosId: doc?.tosId,
    link: doc?.link,
    creationDate: doc?.creationDate,
    allowList: doc?.allowList || [],
    noticeType: doc.noticeType || [],
  };
};
