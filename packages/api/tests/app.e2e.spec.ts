import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesPlannerClient } from '@sales-planner/http-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let client: SalesPlannerClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);

    const url = await app.getUrl();
    const baseUrl = url.replace('[::1]', 'localhost');
    client = new SalesPlannerClient({ baseUrl, apiKey: '' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', async () => {
    const text = await client.getRoot();
    expect(text).toBe('Sales Planner API');
  });

  it('/health (GET)', async () => {
    const body = await client.getHealth();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('version');
  });
});
