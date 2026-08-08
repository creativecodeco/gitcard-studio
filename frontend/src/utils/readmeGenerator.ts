import { escapeHtml } from './escape';
import { t } from './i18n';

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
  const pageUrl =
    generatorUrl ||
    `https://gitcard-studio.creativecode.com.co/?user=${encodeURIComponent(cleanUsername)}`;

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
      : activeCards.map((card) => `![${card.title}](${card.url})`).join('\n\n');

  const footer = isEn
    ? `\n\n---\n*Generated with [GitCard Studio](${pageUrl})*`
    : `\n\n---\n*Generado con [GitCard Studio](${pageUrl})*`;

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

export function renderLiveReadmeHtml(
  username: string,
  activeCards: CardItem[],
  locale: string,
  layout: ReadmeLayout,
  generatorUrl?: string
): string {
  const cleanUser = escapeHtml(username.trim() || 'username');
  const rawPageUrl = generatorUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const safePageUrl = escapeHtml(rawPageUrl);

  if (activeCards.length === 0) {
    return `<h1 style="font-size: 1.4rem; color: #fff; border-bottom: 1px solid #30363d; padding-bottom: 8px; margin-top: 0;">${t('readme_preview_greeting', locale, { username: cleanUser })}</h1>
    <p style="color: #8b949e; margin-bottom: 0;">${t('readme_preview_welcome', locale)}</p>`;
  }

  const titleText = t('readme_preview_greeting', locale, { username: cleanUser });
  const descText = t('readme_preview_desc', locale);
  const sectionTitle = t('readme_preview_section_title', locale);

  let cardsHtml: string;

  if (layout === 'grid') {
    const rows: string[] = [];
    for (let i = 0; i < activeCards.length; i += 2) {
      const c1 = activeCards[i];
      const c2 = activeCards[i + 1];
      const url1 = escapeHtml(c1.url);
      const title1 = escapeHtml(c1.title);
      if (c2) {
        const url2 = escapeHtml(c2.url);
        const title2 = escapeHtml(c2.title);
        rows.push(`<tr>
          <td valign="top" style="padding: 6px; width: 50%;">
            <img src="${url1}" alt="${title1}" style="width: 100%; border-radius: 6px; display: block;" />
          </td>
          <td valign="top" style="padding: 6px; width: 50%;">
            <img src="${url2}" alt="${title2}" style="width: 100%; border-radius: 6px; display: block;" />
          </td>
        </tr>`);
      } else {
        rows.push(`<tr>
          <td valign="top" style="padding: 6px; width: 50%;">
            <img src="${url1}" alt="${title1}" style="width: 100%; border-radius: 6px; display: block;" />
          </td>
          <td style="width: 50%;"></td>
        </tr>`);
      }
    }
    cardsHtml = `<table style="width: 100%; border-collapse: collapse;">${rows.join('')}</table>`;
  } else {
    cardsHtml = activeCards
      .map(
        (c) => `<div style="margin-bottom: 12px;">
        <img src="${escapeHtml(c.url)}" alt="${escapeHtml(c.title)}" style="max-width: 100%; border-radius: 6px; display: block;" />
      </div>`
      )
      .join('');
  }

  const footerText = t('readme_preview_footer', locale);

  return `
    <h1 style="font-size: 1.4rem; color: #fff; border-bottom: 1px solid #30363d; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px;">${titleText}</h1>
    <p style="color: #8b949e; font-size: 0.9rem; margin-bottom: 16px;">${descText}</p>
    <h3 style="font-size: 1.1rem; color: #e6edf3; margin-bottom: 10px;">${sectionTitle}</h3>
    ${cardsHtml}
    <hr style="border: 0; border-top: 1px solid #30363d; margin: 20px 0 10px 0;" />
    <p style="font-size: 0.8rem; color: #8b949e; font-style: italic; margin: 0;">${footerText} &bull; <a href="${safePageUrl}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: none;">${safePageUrl}</a></p>
  `;
}

