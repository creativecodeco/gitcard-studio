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

    // Sanitize and validate input path to prevent path traversal
    const normalizedPath = path.normalize(relativePath);
    if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
      return null;
    }

    const normalizedPublicDir = path.resolve(PUBLIC_DIR);
    const safePath = path.resolve(normalizedPublicDir, normalizedPath);

    // Verify resolved path is strictly inside PUBLIC_DIR
    const relativeResult = path.relative(normalizedPublicDir, safePath);
    if (relativeResult.startsWith('..') || path.isAbsolute(relativeResult)) {
      return null;
    }

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
