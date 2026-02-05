import { Get, Header } from '@nestjs/common';
import { toCsv } from '../lib/index.js';

/**
 * Base controller for providing example CSV/JSON files for import
 */
export abstract class BaseExamplesController<T extends object> {
  protected abstract readonly examples: T[];
  protected abstract readonly entityName: string;
  protected abstract readonly csvColumns: ReadonlyArray<keyof T>;

  @Get('json')
  @Header('Content-Type', 'application/json')
  getJsonExample(): T[] {
    this.setJsonHeaders();
    return this.examples;
  }

  @Get('csv')
  @Header('Content-Type', 'text/csv')
  getCsvExample(): string {
    this.setCsvHeaders();
    return toCsv(this.examples, this.csvColumns);
  }

  private setJsonHeaders(): void {
    // Headers set via decorators above
  }

  private setCsvHeaders(): void {
    // Headers set via decorators above
  }

  protected getJsonFilename(): string {
    return `${this.entityName}-example.json`;
  }

  protected getCsvFilename(): string {
    return `${this.entityName}-example.csv`;
  }
}
