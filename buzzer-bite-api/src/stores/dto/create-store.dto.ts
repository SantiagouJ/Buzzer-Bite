import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateStoreDto {
  @IsUUID('4', { message: 'El ID de usuario debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de usuario es obligatorio' })
  user_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del comercio es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección física es obligatoria' })
  @MaxLength(255, { message: 'La dirección no puede exceder 255 caracteres' })
  address!: string;

  @Type(() => Number)
  @IsLatitude({ message: 'La latitud debe ser una coordenada válida entre -90 y 90' })
  latitude!: number;

  @Type(() => Number)
  @IsLongitude({ message: 'La longitud debe ser una coordenada válida entre -180 y 180' })
  longitude!: number;

  @IsString()
  @IsNotEmpty({ message: 'La categoría del comercio es obligatoria' })
  @MaxLength(50, { message: 'La categoría no puede exceder 50 caracteres' })
  category!: string;

  @IsOptional()
  @IsString()
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'image_url debe ser una URL válida' },
  )
  image_url?: string;
}