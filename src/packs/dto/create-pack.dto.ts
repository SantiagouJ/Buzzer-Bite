import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePackDto {
  @IsUUID('4', { message: 'El ID de la tienda debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID de la tienda es obligatorio' })
  store_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'El título del pack es obligatorio' })
  @MaxLength(150, { message: 'El título no puede exceder 150 caracteres' })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio original debe ser numérico con hasta 2 decimales' })
  @Min(0.01, { message: 'El precio original debe ser mayor a cero' })
  original_price!: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio con descuento debe ser numérico con hasta 2 decimales' })
  @Min(0.01, { message: 'El precio con descuento debe ser mayor a cero' })
  discount_price!: number;

  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock!: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'pickup_start debe tener formato de hora válido HH:mm o HH:mm:ss',
  })
  pickup_start!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
    message: 'pickup_end debe tener formato de hora válido HH:mm o HH:mm:ss',
  })
  pickup_end!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'pickup_date debe tener formato de fecha válido YYYY-MM-DD',
  })
  pickup_date!: string;
}