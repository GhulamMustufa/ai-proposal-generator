import { IsString, IsOptional, IsNumber, IsArray, MinLength } from 'class-validator';

export class CreatePersonaDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dreamCompanies?: string[];

  @IsOptional()
  @IsString()
  idealSalary?: string;

  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  resumeText?: string;
}
