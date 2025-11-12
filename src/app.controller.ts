import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get()
  @ApiOperation({ summary: 'Welcome message' })
  @ApiResponse({ status: 200, description: 'Welcome message returned' })
  getWelcome() {
    return this.appService.getWelcome();
  }
}
