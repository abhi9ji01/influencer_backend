import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class UploadFileDto {
  @ApiPropertyOptional({ example: 'campaigns/assets' })
  @IsOptional()
  @IsString()
  folder?: string;
}

export class UploadFilesDto {
  @ApiPropertyOptional({ example: 'campaigns/assets' })
  @IsOptional()
  @IsString()
  folder?: string;
}

export class DeleteFileDto {
  @ApiProperty({ example: 'campaigns/assets/173000000-file.pdf' })
  @IsString()
  @MinLength(1)
  key!: string;
}

export class DeleteFilesDto {
  @ApiProperty({
    type: [String],
    example: ['campaigns/assets/file-1.pdf', 'campaigns/assets/file-2.png'],
  })
  @IsArray()
  @IsString({ each: true })
  keys!: string[];
}
