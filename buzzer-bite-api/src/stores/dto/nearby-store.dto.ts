import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class NearbyStoreDto {
  @Type(() => Number)
  @IsLatitude({ message: 'La latitud debe ser una coordenada válida entre -90 y 90' })
  latitude!: number;

  @Type(() => Number)
  @IsLongitude({ message: 'La longitud debe ser una coordenada válida entre -180 y 180' })
  longitude!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El radio de búsqueda debe ser un número en kilómetros' })
  @Min(0.5, { message: 'El radio mínimo de búsqueda es 0.5 km' })
  @Max(50, { message: 'El radio máximo de búsqueda es 50 km' })
  radius: number = 5;
}