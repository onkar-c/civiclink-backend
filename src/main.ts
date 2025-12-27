import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3001', 
  });

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

  if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('CivicLink API')
    .setDescription('Civic issue reporting and management API')
    .setVersion('1.0.0')
    .addBearerAuth() // enables JWT "Authorize" button in Swagger UI
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // keeps token in UI during refresh
    },
  });
}

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
