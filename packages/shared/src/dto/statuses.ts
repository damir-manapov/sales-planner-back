// Statuses
export interface CreateStatusRequest {
  code: string;
  title: string;
}

export interface CreateStatusDto {
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}

export interface UpdateStatusDto {
  code?: string;
  title?: string;
}

export type UpdateStatusRequest = UpdateStatusDto;

export interface ImportStatusItem {
  code: string;
  title: string;
}
