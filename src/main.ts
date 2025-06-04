// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình WebSocket với options
  app.useWebSocketAdapter(new IoAdapter(app));

  // Cấu hình CORS cho cả HTTP và WebSocket
  app.enableCors({
    //origin: 'http://localhost:5173',
    origin: 'https://map-thugomrac.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });

  // HTTP Swagger, pipes, v.v. giữ nguyên
  const config = new DocumentBuilder()
    .setTitle('API Các điểm thu gom rác ở Qui Nhơn !')
    .setDescription('API để quản lí các điểm thu gom rác thải')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  Logger.log(`Server running on http://localhost:${port}`);
}
bootstrap();
