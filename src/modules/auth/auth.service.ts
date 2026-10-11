import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { normalizeEmail } from './auth.utils.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const email = normalizeEmail(data.email);
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const user = await this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        passwordHash: this.hashPassword(data.password),
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return this.issueToken(user);
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(data.email) },
    });

    if (!user?.passwordHash || !this.verifyPassword(data.password, user.passwordHash)) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return this.issueToken({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }

  private issueToken(user: { id: string; name: string; email: string }) {
    return {
      accessToken: this.jwt.sign({ sub: user.id, email: user.email }),
      user,
    };
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    const [salt, expectedHash] = storedHash.split(':');
    if (!salt || !expectedHash) return false;

    const actualHash = scryptSync(password, salt, 64).toString('hex');
    const expected = Buffer.from(expectedHash, 'hex');
    const actual = Buffer.from(actualHash, 'hex');

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
