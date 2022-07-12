export interface TermsOfServiceMetadata {
  tosId: string;
  link: string;
  creationDate: string;
  allowList?: string[];
  customAttributes?: {
    [key: string]: any;
  };
}

export interface TermsOfServiceAcceptance {
  tosId: string;
  acceptanceDate: string;
  creationDate: string;
  customAttributes?: {
    [key: string]: any;
  };
}
