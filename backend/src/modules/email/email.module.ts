// email.module.ts
// Módulo de e-mail — disponibiliza o EmailService para outros módulos

import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService], // Exporta para uso em Auth, Orders, etc.
})
export class EmailModule {}
