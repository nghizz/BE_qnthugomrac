import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsNotEmpty()
  @ApiProperty({ example: 'username' })
  username: string;

  @IsNotEmpty()
  @MinLength(6)
  @ApiProperty({ example: 'password' })
  password: string;
}

export class LoginDto {
  @IsString()
  @ApiProperty({ example: 'username' })
  username: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'password' })
  password: string;
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @ApiProperty({ example: 'token' })
  refreshToken: string;
}

