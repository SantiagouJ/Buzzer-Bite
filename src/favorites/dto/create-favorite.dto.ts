import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFavoriteDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
  userId!: string;

  @IsString()
  @IsNotEmpty({ message: 'El ID de la tienda es obligatorio' })
  storeId!: string;
}