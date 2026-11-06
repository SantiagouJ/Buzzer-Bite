import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
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
  @IsLatitude({ message: 'La latitud debe ser una coordenada válida entre -90 y 90' })
  latitude?: number;

  @IsOptional()
  @IsLongitude({ message: 'La longitud debe ser una coordenada válida entre -180 y 180' })
  longitude?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category?: string;
}