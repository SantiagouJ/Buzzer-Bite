import {
  IsInt,
  IsNotEmpty,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @IsUUID('4', { message: 'El ID del consumidor debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del consumidor es obligatorio' })
  consumer_id!: string;

  @IsUUID('4', { message: 'El ID del pack debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del pack es obligatorio' })
  pack_id!: string;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'Debes reservar al menos 1 unidad' })
  quantity!: number;
}
