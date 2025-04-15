import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('API Các điểm thu gom rác ở Qui Nhơn !')
    .setDescription('API để quản lí các điểm thu gom rác thải')
    .setVersion('1.0')
    .addBearerAuth() // Bật authen của Swagger
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Sử dụng middleware để parse JSON
  app.useGlobalPipes(new ValidationPipe()); // Đảm bảo DTO được kiểm tra
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(cookieParser());

  // Cấu hình CORS
  app.enableCors({
    origin: 'http://localhost:5173', // Cho phép nguồn cụ thể (frontend của bạn)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Các phương thức được phép
    allowedHeaders: 'Content-Type,Authorization', // Các header được phép
    credentials: true, // Nếu bạn cần gửi cookie hoặc thông tin xác thực
  });

  const port = process.env.PORT ?? 5000;
  await app.listen(port);

  Logger.log(`Server running on http://localhost:${port}`);
}

bootstrap();
