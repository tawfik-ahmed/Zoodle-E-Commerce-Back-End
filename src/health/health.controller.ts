
import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('ping')
export class HealthController {
  @Get()
  @SkipThrottle()
  ping() {
    return { status: 'ok' };
  }
}
