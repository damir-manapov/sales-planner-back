import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let createdUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users - should return empty array initially', async () => {
    const response = await request(app.getHttpServer()).get('/users');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /users - should create a user', async () => {
    const newUser = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
    };

    const response = await request(app.getHttpServer()).post('/users').send(newUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(newUser.email);
    expect(response.body.name).toBe(newUser.name);

    createdUserId = response.body.id;
  });

  it('GET /users/:id - should return created user', async () => {
    const response = await request(app.getHttpServer()).get(`/users/${createdUserId}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdUserId);
  });

  it('GET /users/:id - should return 404 for non-existent user', async () => {
    const response = await request(app.getHttpServer()).get('/users/999999');

    expect(response.status).toBe(404);
  });

  it('DELETE /users/:id - should delete created user', async () => {
    const response = await request(app.getHttpServer()).delete(`/users/${createdUserId}`);

    expect(response.status).toBe(200);

    // Verify user is deleted
    const getResponse = await request(app.getHttpServer()).get(`/users/${createdUserId}`);
    expect(getResponse.status).toBe(404);
  });
});
