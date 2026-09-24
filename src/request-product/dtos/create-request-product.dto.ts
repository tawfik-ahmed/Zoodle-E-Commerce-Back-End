import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';
import { normalizeText } from '../../utils/normalize';

export class CreateRequestProductDto {
  @IsString({ message: 'title must be a string' })
  @Transform(({ value }) => normalizeText(value))
  title: string;

  @MinLength(5, {
    message: 'description must be at least 5 characters long',
  })
  @IsString({ message: 'description must be a string' })
  description: string;

  @IsString({ message: 'imageCover must be a string' })
  @IsUrl({}, { message: 'imageCover must be a valid url' })
  imageCover: string;

  @IsNumber({}, { message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity: number;

  @IsNumber({}, { message: 'price must be a number' })
  @Min(0, { message: 'price must be greater than or equal to 0' })
  price: number;

  @IsOptional()
  @IsNumber({}, { message: 'discount must be a number' })
  @Min(0, { message: 'discount must be greater than or equal to 0' })
  discount?: number;

  @IsNumber({}, { message: 'categoryId must be an integer' })
  categoryId: number;

  @IsNumber({}, { message: 'subCategoryId must be an integer' })
  subCategoryId: number;

  @IsNumber({}, { message: 'brandId must be an integer' })
  brandId: number;

  @IsArray({ message: 'colors must be an array' })
  @IsOptional()
  colorNames?: string[];
}
