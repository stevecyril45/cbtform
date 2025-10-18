export interface Partner {
  id: string;
  businessName: string;
  firstName: string;
  lastName: string;
  registrationType: string;
  businessNumber: string;
  terms1: string;
  terms2: string;
  email?: string;
  token?: number | string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  verifiers: string[];
  tokens?: any[];
  roles?: string[];
  balance?: any;
  points?: number;
  transactions?: any[];
  exchanger?: any[];
}
