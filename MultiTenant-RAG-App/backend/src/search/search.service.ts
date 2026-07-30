import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SearchService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async search(question: string) {
    if (!question || question.trim().length === 0) {
      throw new BadRequestException('Question is required');
    }

    const ragUrl = this.configService.get('RAG_SERVICE_URL', 'http://localhost:8000');
    const response = await firstValueFrom(
      this.httpService.post(`${ragUrl}/rag/query`, { question }),
    );

    return {
      answer: response.data?.answer || 'No answer found',
      sources: response.data?.sources || [],
      tenantId: 'default',
    };
  }
}