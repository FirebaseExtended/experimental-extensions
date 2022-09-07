export interface NoticeMetadata {
  noticeId: string;
  link: string;
  creationDate?: string;
  allowList?: string[];
  noticeType?: string;
  preferences?: Record<string, any>[];
}

export enum AcknowledgementStatus {
  SEEN = "seen",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

export interface Acknowledgement {
  noticeId: string;
  acknowledgedDate: string | null;
  unacknowledgedDate: string | null;
  creationDate: string;
  noticeType: string;
  extensionId?: string;
  status: AcknowledgementStatus;
  preferences?: Record<string, any>[];
}

export interface Preference {
  name: string;
  description: string;
  duration?: string;
  value?: string;
  options?: string[];
  required: boolean;
  active?: boolean;
}
