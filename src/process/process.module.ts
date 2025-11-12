import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProcessService } from './process.service';
import { ProcessController } from './process.controller';
import { ProcessVersionService } from './process-version.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'process-queue',
    }),
  ],
  controllers: [ProcessController],
  providers: [ProcessService, ProcessVersionService],
  exports: [ProcessService, ProcessVersionService],
})
export class ProcessModule {}
