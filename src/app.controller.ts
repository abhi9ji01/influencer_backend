import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { renderStatusPage } from './views/status-page.template';

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  getWelcome(@Res() res: Response) {
    const host = process.env.APP_HOST ?? 'localhost';
    const port = Number(process.env.PORT ?? 8000);

    return res
      .status(200)
      .type('html')
      .send(
        renderStatusPage({
          apiBaseUrl: `http://${host}:${port}/api`,
          docsUrl: `http://${host}:${port}/docs`,
          version: '1.0.0',
        }),
      );
  }
}
