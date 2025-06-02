// src/auth/auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Socket } from 'socket.io'
import { Request } from 'express'

interface CustomRequest extends Request {
  user?: any
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const ctxType = context.getType()
    let token: string | undefined
    let payload: any

    if (ctxType === 'http') {
      const req = context.switchToHttp().getRequest<CustomRequest>()
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token is missing or invalid')
      }
      token = authHeader.split(' ')[1]
      try {
        payload = this.jwtService.verify(token)
        req.user = {
          id: payload.sub,
          role: payload.role,
          username: payload.username,
        }
        return true
      } catch (err) {
        this.handleJwtError(err)
      }
    } else if (ctxType === 'ws') {
      const client: Socket = context.switchToWs().getClient<Socket>()
      token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string)
      if (!token) {
        throw new UnauthorizedException('WebSocket token is missing')
      }
      try {
        payload = this.jwtService.verify(token)
        client.data.user = {
          id: payload.sub,
          role: payload.role,
          username: payload.username,
        }
        console.log('[AuthGuard] user:', client.data.user)
        return true
      } catch (err) {
        this.handleJwtError(err)
      }
    }

    throw new UnauthorizedException()
  }

  private handleJwtError(error: any): never {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token has expired')
    }
    throw new UnauthorizedException('Token is invalid')
  }
}

