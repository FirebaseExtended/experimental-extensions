export interface NoticeMetadata {
  tosId: string;
  link: string;
  creationDate: string;
  allowList?: string[];
  noticeType?: {
    [key: string]: any;
  };
}

export interface Acknowledgement {
  tosId: string;
  acknowledgedDate: string | null;
  unacknowledgedDate: string | null;
  creationDate: string;
  noticeType: {
    [key: string]: any;
  };
  acknowledged?: boolean;
  extensionId?: string;
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
