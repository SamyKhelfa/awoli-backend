import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Email',
    example: 'test@example.com',
    uniqueItems: true,
  })
  readonly email: string;

  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  readonly name: string;

  @ApiProperty({
    description: 'The pasword of the user',
    example: 'test1234',
  })
  readonly password: string;
  displayName: string;
  sessionId: any;
}
