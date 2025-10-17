export interface PdpConfig {
  host: string;
  headers?: Record<string, string>;
}

export type PdpMap = Record<string, PdpConfig>;

export interface PdpRequestArgs {
  endpoint: string;
  payload: unknown;
  pdpId: string;
}
