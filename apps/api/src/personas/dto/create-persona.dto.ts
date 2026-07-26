import { IsString, IsOptional, IsNumber, IsArray, MinLength, ArrayMinSize } from 'class-validator';

export class CreatePersonaDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(5)
  skills: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dreamCompanies?: string[];

  @IsNumber()
  yearsOfExperience: number;

  @IsString()
  @MinLength(10)
  resumeText: string;

  @IsOptional()
  jobFilters?: Record<string, any>;
}
