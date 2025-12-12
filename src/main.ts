import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unexpected properties
      forbidNonWhitelisted: true, // throws if unknown props are sent
      transform: true, // transforms payloads to DTO classes
      transformOptions: {
      enableImplicitConversion: true,
    }
    }),
  );

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
