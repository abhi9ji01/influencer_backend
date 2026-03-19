import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message = exception?.message ?? 'File upload failed.';

    if (exception?.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file exceeds the allowed size limit.';
    }

    response.status(400).json({
      success: false,
      statusCode: 400,
      message,
      error: 'Bad Request',
    });
  }
}
