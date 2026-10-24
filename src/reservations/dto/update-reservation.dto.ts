import {
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  quantity?: number;
}