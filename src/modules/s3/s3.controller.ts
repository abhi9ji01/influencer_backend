import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import {
  DeleteFileDto,
  DeleteFilesDto,
  UploadFileDto,
  UploadFilesDto,
} from './dto/upload.dto';
import { MulterExceptionFilter } from './multer-exception.filter';
import { S3Service } from './s3.service';

@ApiTags('Upload')
@ApiBearerAuth()
@UseFilters(MulterExceptionFilter)
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('single')
  @ApiOperation({ summary: 'Upload a single file to AWS S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Optional S3 folder path',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  async uploadSingleFile(
    @UploadedFile() file: any,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.s3Service.uploadFile(file, uploadFileDto.folder);

    return {
      success: true,
      message: 'File uploaded successfully',
      data: result,
    };
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple files to AWS S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        folder: {
          type: 'string',
          description: 'Optional S3 folder path',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Files uploaded successfully' })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  async uploadMultipleFiles(
    @UploadedFiles() files: any[],
    @Body() uploadFilesDto: UploadFilesDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results = await this.s3Service.uploadFiles(files, uploadFilesDto.folder);

    return {
      success: true,
      message: 'Files uploaded successfully',
      data: results,
    };
  }

  @Delete('single')
  @ApiOperation({ summary: 'Delete a single S3 file' })
  async deleteSingleFile(@Body() deleteFileDto: DeleteFileDto) {
    await this.s3Service.deleteFile(deleteFileDto.key);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  @Delete('multiple')
  @ApiOperation({ summary: 'Delete multiple S3 files' })
  async deleteMultipleFiles(@Body() body: DeleteFilesDto) {
    if (!body.keys || body.keys.length === 0) {
      throw new BadRequestException('No file keys provided');
    }

    await this.s3Service.deleteFiles(body.keys);

    return {
      success: true,
      message: 'Files deleted successfully',
    };
  }

  @Get('signed-url/:key')
  @ApiOperation({ summary: 'Get signed URL for an S3 file' })
  async getSignedUrl(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    const signedUrl = await this.s3Service.getSignedUrl(
      decodeURIComponent(key),
      expiresIn,
    );

    return {
      success: true,
      message: 'Signed URL generated successfully',
      data: { signedUrl },
    };
  }

  @Get('exists/:key')
  @ApiOperation({ summary: 'Check if an S3 file exists' })
  async checkFileExists(@Param('key') key: string) {
    const exists = await this.s3Service.fileExists(decodeURIComponent(key));

    return {
      success: true,
      message: 'File existence check completed',
      data: { exists },
    };
  }

  @Get('metadata/:key')
  @ApiOperation({ summary: 'Get S3 file metadata' })
  async getFileMetadata(@Param('key') key: string) {
    const metadata = await this.s3Service.getFileMetadata(
      decodeURIComponent(key),
    );

    return {
      success: true,
      message: 'File metadata retrieved successfully',
      data: metadata,
    };
  }
}

