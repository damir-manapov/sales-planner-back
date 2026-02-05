// Groups
export interface CreateGroupRequest {
  code: string;
  title: string;
}

export interface CreateGroupDto {
  code: string;
  title: string;
  shop_id: number;
  tenant_id: number;
}

export interface UpdateGroupDto {
  code?: string;
  title?: string;
}

export type UpdateGroupRequest = UpdateGroupDto;

export interface ImportGroupItem {
  code: string;
  title: string;
}
