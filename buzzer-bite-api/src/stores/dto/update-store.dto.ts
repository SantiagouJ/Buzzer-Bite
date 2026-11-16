import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude({ message: 'La latitud debe ser una coordenada válida entre -90 y 90' })
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude({ message: 'La longitud debe ser una coordenada válida entre -180 y 180' })
  longitude?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'image_url debe ser una URL válida' },
  )
  image_url?: string;
}