import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    };
  }

  getWelcome() {
    return {
      message: 'Welcome to VSTTour AI Platform',
      version: '1.0.0',
      documentation: '/api/v1/docs',
    };
  }
}
