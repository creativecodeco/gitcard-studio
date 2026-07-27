import { Injectable, NotFoundException } from '@nestjs/common';
import path from 'node:path';
import fs from 'node:fs';

/** Base directory for compiled public static assets */
const PUBLIC_DIR = path.resolve(__dirname, '../../../../public');

@Injectable()
export class HtmlFileService {
  /**
   * Reads and returns the content of a public HTML file.
   * Returns null if the file does not exist.
   */
  readPublicFile(relativePath: string): string | null {
    if (typeof relativePath !== 'string' || relativePath.includes('\0')) {
      return null;
    }

    const safePath = path.resolve(PUBLIC_DIR, relativePath);
    const normalizedPublicDir = path.resolve(PUBLIC_DIR);

    if (!safePath.startsWith(normalizedPublicDir + path.sep) && safePath !== normalizedPublicDir) {
      return null;
    }

    if (!fs.existsSync(safePath)) return null;
    return fs.readFileSync(safePath, 'utf-8');
  }

  /**
   * Reads a public HTML file or throws a NotFoundException.
   */
  getPublicFileOrThrow(relativePath: string, notFoundMessage = 'Page not found.'): string {
    const content = this.readPublicFile(relativePath);
    if (content === null) {
      throw new NotFoundException(notFoundMessage);
    }
    return content;
  }
}
