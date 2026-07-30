import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('query')
  async query(@Body() dto: { question: string }) {
    return this.searchService.search(dto.question);
  }

  @Get('history')
  async history(@Query('limit') limit?: number) {
    return [];
  }
}