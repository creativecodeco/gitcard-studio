export function escapeXml(unsafe: unknown): string {
  const str = typeof unsafe === 'string' ? unsafe : String(unsafe ?? '');
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

export function minifySvg(svg: unknown): string {
  const str = typeof svg === 'string' ? svg : String(svg ?? '');
  return str.replace(/>\s+</g, '><').trim();
}
