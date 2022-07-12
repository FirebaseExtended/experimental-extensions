export interface ICRMProvider {
  create: (issue: string | number) => Promise<void>;
  delete: (id: string | number) => Promise<void>;
  list: (props: any) => Promise<any>;
}
