import type {
  Status,
  CreateStatusRequest,
  UpdateStatusRequest,
  ImportStatusItem,
  StatusExportItem,
} from '@sales-planner/shared';
import type { ClientConfig } from './base-client.js';
import { CodedEntityClient } from './coded-entity-client.js';

export class StatusesClient extends CodedEntityClient<
  Status,
  CreateStatusRequest,
  UpdateStatusRequest,
  ImportStatusItem,
  StatusExportItem
> {
  constructor(config: ClientConfig) {
    super(config, 'statuses');
  }
}
