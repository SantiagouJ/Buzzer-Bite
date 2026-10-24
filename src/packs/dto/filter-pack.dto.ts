import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { PackStatus } from '../entities/pack.entity';

export class FilterPackDto {
  @IsOptional()
  @IsIn([PackStatus.AVAILABLE, PackStatus.SOLD_OUT, PackStatus.EXPIRED], {
    message: 'El filtro status debe ser AVAILABLE, SOLD_OUT o EXPIRED',
  })
  status?: PackStatus;

  @IsOptional()
  @IsUUID('4', { message: 'store_id debe ser un UUID válido' })
  store_id?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(50, { message: 'El límite máximo es 50' })
  limit: number = 10;
}