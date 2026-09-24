import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { normalizeText } from '../../utils/normalize';

export class SignUpDto {
  @IsString()
  @Length(3, 35, {
    message: 'Name must be at least 3 characters long and no more than 35',
  })
  @Transform(({ value }) => normalizeText(value))
  name: string;

  @IsEmail({}, { message: 'Incorrect email' })
  @MaxLength(50, { message: 'Email must be no more than 50 characters' })
  email: string;

  @IsString()
  @Length(6, 40, {
    message: 'Password must be at least 6 characters long and no more than 20',
  })
  password: string;

  @IsString()
  @IsPhoneNumber('EG', { message: 'Incorrect phone number' })
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @MaxLength(100, { message: 'Address must be no more than 100 characters' })
  @IsOptional()
  @Transform(({ value }) => normalizeText(value))
  address?: string;
}
