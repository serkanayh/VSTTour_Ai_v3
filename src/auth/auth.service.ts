import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    const isPasswordValid = await this.usersService.validatePassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    });

    // Store session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
      },
    });

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async logout(userId: string, token: string) {
    // Delete session
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
      },
    });

    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload: JwtPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      const accessToken = this.jwtService.sign(newPayload);

      // Update session
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          token: accessToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
