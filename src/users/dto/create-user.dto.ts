import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(50)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  full_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}