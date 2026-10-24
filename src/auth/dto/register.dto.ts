import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @IsEmail()
  @MaxLength(150)
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(15)
  @MaxLength(128)
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9\s-_]+$/, {
    message: "El campo solo puede contener letras, números, espacios y guiones",
  })
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
