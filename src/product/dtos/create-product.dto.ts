import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
  MinLength,
} from 'class-validator';
import { normalizeText } from '../../utils/normalize';

export class CreateProductDto {
  @IsString({ message: 'title must be a string' })
  @Length(3, 150, {
    message: 'title must be at least 3 characters long and no more than 150',
  })
  @Transform(({ value }) => normalizeText(value))
  title: string;

  @IsString({ message: 'description must be a string' })
  @MinLength(20, { message: 'description must be at least 20 characters long' })
  description: string;

  @IsNumber({}, { message: 'price must be a number' })
  @Min(1, { message: 'price must be at least 1' })
  quantity: number;

  @IsUrl({}, { message: 'image cover must be a valid url' })
  imageCover: string;

  @IsArray({ message: 'images must be an array' })
  @IsUrl({}, { message: 'images must be an array of valid urls', each: true })
  @IsOptional()
  images?: Array<string>;

  @IsNumber({}, { message: 'price must be a number' })
  @Min(1, { message: 'price must be at least 1' })
  price: number;

  @IsNumber({}, { message: 'price after discount must be a number' })
  @Min(1, { message: 'price must be at least 1' })
  @IsOptional()
  discount?: number;

  @IsArray({ message: 'colors must be an array' })
  @IsString({ each: true, message: 'each color must be a string' })
  @IsOptional()
  colors?: Array<string>;

  @IsNumber({}, { message: 'category Id must be a number' })
  categoryId: number;

  @IsNumber({}, { message: 'sub category Id must be a number' })
  subCategoryId: number;

  @IsNumber({}, { message: 'brand Id must be a number' })
  brandId: number;
}
