import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from 'vitest';
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
    it('should return status ok', () => {
      expect(appController.getHealth()).toEqual({ status: 'ok' });
    });
  });
});
