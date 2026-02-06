import type {
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  ImportGroupItem,
  GroupExportItem,
} from '@sales-planner/shared';
import type { ClientConfig } from './base-client.js';
import { CodedEntityClient } from './coded-entity-client.js';

export class GroupsClient extends CodedEntityClient<
  Group,
  CreateGroupRequest,
  UpdateGroupRequest,
  ImportGroupItem,
  GroupExportItem
> {
  constructor(config: ClientConfig) {
    super(config, 'groups');
  }
}

