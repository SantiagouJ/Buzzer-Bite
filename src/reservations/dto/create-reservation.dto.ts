import {
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID del consumidor es obligatorio' })
  consumer_id!: string;

  @IsString()
  @IsNotEmpty({ message: 'El ID del pack es obligatorio' })
  pack_id!: string;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'Debes reservar al menos 1 unidad' })
  quantity!: number;
}