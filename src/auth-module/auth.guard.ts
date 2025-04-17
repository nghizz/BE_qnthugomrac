// src/auth/auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { Request } from 'express';

interface CustomRequest extends Request {
  user?: any;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const ctxType = context.getType<'http' | 'ws' | string>();
    let token: string | undefined;
    let payload: any;

    if (ctxType === 'http') {
      // HTTP request
      const req = context.switchToHttp().getRequest<CustomRequest>();
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token is missing or invalid');
      }
      token = authHeader.split(' ')[1];
      try {
        payload = this.jwtService.verify(token);
        req.user = payload;
        return true;
      } catch (err) {
        this.handleJwtError(err);
      }
    } else if (ctxType === 'ws') {
      // WebSocket connection
      const client: Socket = context.switchToWs().getClient<Socket>();
      // Bạn có thể lấy từ client.handshake.auth hoặc query
      token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string);
      if (!token) {
        throw new UnauthorizedException('WebSocket token is missing');
      }
      try {
        payload = this.jwtService.verify(token);
        // gán vào client.data để gateway có thể đọc
        client.data.user = payload;
        return true;
      } catch (err) {
        this.handleJwtError(err);
      }
    }

    // Loại context khác (RPC, gRPC...) mặc định block
    throw new UnauthorizedException();
  }

  private handleJwtError(error: any): never {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token has expired');
    }
    throw new UnauthorizedException('Token is invalid');
  }
}
