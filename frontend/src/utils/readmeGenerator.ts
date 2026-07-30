export interface CardItem {
  id: string;
  title: string;
  url: string;
}

export type ReadmeLayout = 'vertical' | 'grid';

export function generateSampleReadme(
  username: string,
  activeCards: CardItem[],
  locale: string = 'es',
  layout: ReadmeLayout = 'vertical',
  generatorUrl?: string
): string {
  const cleanUsername = username.trim() || 'username';
  const isEn = locale === 'en';
  const pageUrl = generatorUrl || `https://github-helpers.creativecode.com.co/?user=${encodeURIComponent(cleanUsername)}`;

  if (activeCards.length === 0) {
    return isEn
      ? `# Hi there, I'm @${cleanUsername} 👋\n\nWelcome to my GitHub profile!`
      : `# ¡Hola! Soy @${cleanUsername} 👋\n\nBienvenido/a a mi perfil de GitHub.`;
  }

  const header = isEn
    ? `# Hi there, I'm @${cleanUsername} 👋\n\nWelcome to my GitHub profile! Here are some of my automated GitHub stats:\n\n### 📊 GitHub Stats\n`
    : `# ¡Hola! Soy @${cleanUsername} 👋\n\nBienvenido/a a mi perfil de GitHub. Aquí puedes ver algunas de mis estadísticas de GitHub en tiempo real:\n\n### 📊 Estadísticas de GitHub\n`;

  const cardsMarkdown =
    layout === 'grid'
      ? formatGridCards(activeCards)
      : activeCards
          .map((card) => `![${card.title}](${card.url})`)
          .join('\n\n');

  const footer = isEn
    ? `\n\n---\n*Generated with [GitHub Helpers](${pageUrl})*`
    : `\n\n---\n*Generado con [GitHub Helpers](${pageUrl})*`;

  return `${header}\n${cardsMarkdown}${footer}`;
}

function formatGridCards(activeCards: CardItem[]): string {
  const rows: string[] = [];
  for (let i = 0; i < activeCards.length; i += 2) {
    const card1 = activeCards[i];
    const card2 = activeCards[i + 1];

    if (card2) {
      rows.push(`  <tr>
    <td valign="top" width="50%">
      <img src="${card1.url}" alt="${card1.title}" width="100%" />
    </td>
    <td valign="top" width="50%">
      <img src="${card2.url}" alt="${card2.title}" width="100%" />
    </td>
  </tr>`);
    } else {
      rows.push(`  <tr>
    <td valign="top" colspan="2" align="center">
      <img src="${card1.url}" alt="${card1.title}" />
    </td>
  </tr>`);
    }
  }

  return `<table border="0">\n${rows.join('\n')}\n</table>`;
}

