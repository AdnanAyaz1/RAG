import { Controller, Get, Post, Param } from '@nestjs/common';
import { DocumentService } from './document.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  async upload() {
    return { message: 'Document uploaded' };
  }

  @Get(':id')
  async getDocument(@Param('id') id: string) {
    return { id, title: 'Sample Doc', status: 'processed' };
  }

  @Get()
  async listDocuments() {
    return [{ id: '1', title: 'Doc 1' }];
  }
}