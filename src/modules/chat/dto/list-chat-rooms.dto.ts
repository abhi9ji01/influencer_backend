import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class ListChatRoomsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: '6cbd0ad3-43a0-4063-9ef5-df4d0ba0dba1',
    description: 'Filter rooms by booking ID.',
  })
  @IsOptional()
  @IsUUID()
  bookingId?: string;
}
