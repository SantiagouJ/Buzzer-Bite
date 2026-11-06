import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class ClaimOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'El código de verificación QR es obligatorio' })
  @MaxLength(64, { message: 'El código de verificación no puede superar 64 caracteres' })
  verification_code!: string;
}
