export interface TermsOfServiceMetadata {
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
  acceptanceDate: string;
  creationDate: string;
  noticeType?: {
    [key: string]: any;
  };
  status: string;
}
