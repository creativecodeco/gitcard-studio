import { describe, it, expect } from 'vitest';
import { HtmlFileService } from '../src/modules/root/html-file.service';
import { NotFoundException } from '@nestjs/common';

describe('HtmlFileService', () => {
  const service = new HtmlFileService();

  describe('readPublicFile', () => {
    it('should return null for non-string or null-byte paths', () => {
      expect(service.readPublicFile(null as unknown as string)).toBeNull();
      expect(service.readPublicFile('index.html\0.png')).toBeNull();
    });

    it('should prevent path traversal outside public directory', () => {
      expect(service.readPublicFile('../package.json')).toBeNull();
      expect(service.readPublicFile('../../../etc/passwd')).toBeNull();
    });

    it('should return null for non-existent files within public directory', () => {
      expect(service.readPublicFile('non-existent-file-12345.html')).toBeNull();
    });
  });

  describe('getPublicFileOrThrow', () => {
    it('should throw NotFoundException for invalid or missing files', () => {
      expect(() => service.getPublicFileOrThrow('../package.json')).toThrow(NotFoundException);
      expect(() => service.getPublicFileOrThrow('missing.html', 'Custom error')).toThrow('Custom error');
    });
  });
});
