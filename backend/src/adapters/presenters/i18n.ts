export interface TranslationSet {
  stats: {
    commits: string;
    stars: string;
    followers: string;
    prs: string;
    issues: string;
    forks: string;
  };
  languages: {
    title: string;
  };
  rank: {
    title: string;
    collab: string;
    rankLegendary: string;
    rankOutstanding: string;
    rankActive: string;
    rankGrowing: string;
  };
  streak: {
    title: string;
    current: string;
    max: string;
    total: string;
    days: string;
    noStreak: string;
    present: string;
  };
  trophies: {
    title: string;
  };
  topRepos: {
    title: string;
    stars: string;
    noLicense: string;
  };
  sponsors: {
    title: string;
    total: string;
    monthly: string;
    oneTime: string;
    estMonthly: string;
    noSponsors: string;
    becomeSponsor: string;
  };
}

function buildTranslationSet(isEnglish: boolean): TranslationSet {
  return {
    stats: {
      commits: 'Commits:',
      stars: isEnglish ? 'Stars:' : 'Estrellas:',
      followers: isEnglish ? 'Followers:' : 'Seguidores:',
      prs: 'PRs:',
      issues: 'Issues:',
      forks: 'Forks:'
    },
    languages: {
      title: isEnglish ? 'Most Used Languages' : 'Lenguajes Más Usados'
    },
    rank: {
      title: isEnglish ? 'Developer Rank' : 'Rango de Desarrollador',
      collab: isEnglish ? 'Collaboration Index' : 'Índice de Colaboración',
      rankLegendary: isEnglish ? 'Legendary Developer / Elite Contributor' : 'Desarrollador Legendario / Contribuidor Elite',
      rankOutstanding: isEnglish ? 'Outstanding Developer / Very Active' : 'Desarrollador Sobresaliente / Muy Activo',
      rankActive: isEnglish ? 'Active & Collaborative Developer' : 'Desarrollador Activo y Colaborativo',
      rankGrowing: isEnglish ? 'Growing Developer' : 'Desarrollador en crecimiento'
    },
    streak: {
      title: isEnglish ? 'Contribution Streak' : 'Racha de Contribuciones',
      current: isEnglish ? 'Current Streak' : 'Racha Actual',
      max: isEnglish ? 'Longest Streak' : 'Racha Máxima',
      total: isEnglish ? 'Total Contributions' : 'Total Contribuciones',
      days: isEnglish ? 'days' : 'días',
      noStreak: isEnglish ? 'No active streak' : 'Sin racha activa',
      present: isEnglish ? 'Present' : 'Presente'
    },
    trophies: {
      title: isEnglish ? 'GitHub Trophies' : 'Trofeos de GitHub'
    },
    topRepos: {
      title: isEnglish ? 'Top Repositories' : 'Top Repositorios',
      stars: isEnglish ? 'by stars' : 'por estrellas',
      noLicense: isEnglish ? 'No License' : 'Sin Licencia'
    },
    sponsors: {
      title: isEnglish ? 'GitHub Sponsors' : 'Sponsors de GitHub',
      total: isEnglish ? 'Total Sponsors:' : 'Total Sponsors:',
      monthly: isEnglish ? 'Monthly:' : 'Mensuales:',
      oneTime: isEnglish ? 'One-time:' : 'Pago Único:',
      estMonthly: isEnglish ? 'Est. Monthly:' : 'Est. Mensual:',
      noSponsors: isEnglish ? 'No public sponsors yet' : 'Aún sin sponsors públicos',
      becomeSponsor: isEnglish ? 'Become a Sponsor' : 'Sé un Sponsor'
    }
  };
}

export const TRANSLATIONS: Record<'es' | 'en', TranslationSet> = {
  es: buildTranslationSet(false),
  en: buildTranslationSet(true)
};

export function getTranslations(locale?: string): TranslationSet {
  const normalized = (locale || 'es').toLowerCase();
  if (normalized === 'en') {
    return TRANSLATIONS.en;
  }
  return TRANSLATIONS.es;
}
