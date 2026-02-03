import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Sales Planner API"', () => {
      expect(appController.getHello()).toBe('Sales Planner API');
    });
  });

  describe('health', () => {
    it('should return status ok with version', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.version).toBeDefined();
      expect(typeof result.version).toBe('string');
    });
  });
});
