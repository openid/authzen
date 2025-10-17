export enum AuditType {
  AuthN = "AuthN",
  AuthZ = "AuthZ",
}

export interface AuthenticationAuditRecord {
  idp: string;
  message: string;
  ok?: boolean;
  response?: unknown;
}

export interface AuthorizationAuditRecord {
  endpoint: string;
  payload: unknown;
  pdpId: string;
  ok: boolean;
  message?: string;
  response?: unknown;
}

export type AuditBody = AuthenticationAuditRecord | AuthorizationAuditRecord;

export interface AuditEntry {
  timestamp: string;
  type: AuditType;
  body: AuditBody;
}
