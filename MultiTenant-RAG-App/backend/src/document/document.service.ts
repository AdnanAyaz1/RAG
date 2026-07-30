import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentService {
  async uploadFile(file: Express.Multer.File, tenantId: string) {
    return {
      id: 'doc-' + Date.now(),
      originalName: file.originalname,
      tenantId,
      status: 'uploaded',
    };
  }

  async getDocument(id: string) {
    return { id, title: 'Document', status: 'processed' };
  }

  async listByTenant(tenantId: string) {
    return [];
  }
}