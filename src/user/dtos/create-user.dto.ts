import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { UserGender, UserRole } from '../../utils/enums'; 
import { normalizeText } from '../../utils/normalize';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @Length(3, 35, {
    message: 'Name must be at least 3 characters long and no more than 35',
  })
  @Transform(({ value }) => normalizeText(value))
  name: string;

  @IsEmail({}, { message: 'Incorrect email' })
  @MaxLength(50, { message: 'Email must be no more than 50 characters' })
  @Transform(({ value }) => normalizeText(value))
  email: string;

  @IsString()
  @Length(6, 40, {
    message: 'Password must be at least 6 characters long and no more than 20',
  })
  password: string;

  @IsEnum(UserRole, { message: 'Incorrect role' })
  @IsOptional()
  role?: UserRole;

  @IsNumber()
  @Min(10, { message: 'Incorrect age' })
  @Max(100, { message: 'Incorrect age' })
  @IsOptional()
  age?: number;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'avatar must be a valid url' })
  avatar?: string;

  @IsString()
  @IsPhoneNumber('EG', { message: 'Incorrect phone number' })
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @MaxLength(100, { message: 'Address must be no more than 100 characters' })
  @IsOptional()
  @Transform(({ value }) => normalizeText(value))
  address?: string;

  @IsEnum(UserGender, { message: 'Incorrect gender' })
  @IsOptional()
  gender?: UserGender;
}