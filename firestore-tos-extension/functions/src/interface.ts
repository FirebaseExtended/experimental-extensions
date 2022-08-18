export interface NoticeMetadata {
  noticeId: string;
  link: string;
  creationDate: string;
  allowList?: string[];
  noticeType?: {
    [key: string]: any;
  };
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
  noticeType: {
    [key: string]: any;
  };
  extensionId?: string;
  status: AcknowledgementStatus;
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
