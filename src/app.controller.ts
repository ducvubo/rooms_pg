import { Controller, Get, Inject, OnModuleInit, Query } from '@nestjs/common'
import { AppService } from './app.service'
import { ResponseMessage } from './decorator/customize'
import { ClientGrpc } from '@nestjs/microservices'
import AppInterface from './app.interface'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('generate')
  @ResponseMessage('Generate content successfully')
  async generate(@Query('title') title: string): Promise<{ content: string }> {
    const content = await this.appService.generateContent(title);
    return { content };
  }
}
