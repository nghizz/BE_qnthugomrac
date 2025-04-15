import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './auth.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

@Injectable()
export class AuthModuleService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string) {
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({
      username,
      password: hashedPassword,
    });
    return this.userRepository.save(newUser);
  }

  async login(username: string, password: string, res: Response) {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // Xoá refreshToken cũ
    await this.userRepository.update(user.id, { refreshToken: '' });

    // Tạo payload
    const payload = { sub: user.id, username: user.username, role: user.role };

    // Tạo accessToken 15 phút
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Tính expiresAt = now + 15 phút (để FE lưu)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Tạo refreshToken 7 ngày
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' },
    );

    // Lưu refreshToken vào DB
    await this.userRepository.update(user.id, { refreshToken });

    // Set cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      user: { id: user.id, username: user.username, role: user.role },
      accessToken,
      expiresAt,
    });
  }

  async refreshToken(req: Request, res: Response) {
    const oldRefreshToken = req.cookies.refreshToken;
    if (!oldRefreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    try {
      const payload = this.jwtService.verify(oldRefreshToken);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user || user.refreshToken !== oldRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Tạo accessToken mới
      const newAccessToken = this.jwtService.sign(
        { sub: user.id, username: user.username, role: user.role },
        { expiresIn: '15m' },
      );
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Tạo refreshToken mới
      const newRefreshToken = this.jwtService.sign(
        { sub: user.id },
        { expiresIn: '7d' },
      );

      await this.userRepository.update(user.id, {
        refreshToken: newRefreshToken,
      });

      // Set cookie refreshToken mới
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ accessToken: newAccessToken, expiresAt });
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: number) {
    await this.userRepository.update({ id: userId }, { refreshToken: '' });
    return { message: 'Logout successful' };
  }
}
