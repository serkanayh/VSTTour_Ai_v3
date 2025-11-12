import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProcessModule } from './process/process.module';
import { AiOrchestratorModule } from './ai-orchestrator/ai-orchestrator.module';
import { ApprovalModule } from './approval/approval.module';
import { IntegrationModule } from './integration/integration.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';
import * as Joi from 'joi';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
      }),
    }),

    // BullMQ Queue System
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),

    // Core modules
    PrismaModule,
    AuthModule,
    UsersModule,
    ProcessModule,
    AiOrchestratorModule,
    ApprovalModule,
    IntegrationModule,
    AdminModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
