import { JwtService } from '@nestjs/jwt';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDTO } from './dto';
import { IRegisterResponse, ILoginResponse } from './responses';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService)
    private prisma: PrismaService,
    @Inject(JwtService)
    private jwtService: JwtService,
  ) {}

  private getToken(user: User): string {
    return this.jwtService.sign({
      userId: user.id,
    });
  }

  async login(dto: LoginDTO): Promise<ILoginResponse> {
    const { email, password } = dto;

    if (!email || !password) {
      throw new HttpException(
        'Email and password are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const authToken = this.getToken(user);

    return {
      user,
      authToken,
    };
  }

  async register(dto: RegisterDto): Promise<IRegisterResponse> {
    const { email, name, password, displayName, sessionId } = dto;

    const existingUser = await this.prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      throw new HttpException('Email is already in use', HttpStatus.CONFLICT);
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new HttpException('Invalid session ID', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        displayName,
        session: {
          connect: { id: sessionId },
        },
      },
    });

    const authToken = this.getToken(user);

    return {
      user,
      authToken,
    };
  }
}
