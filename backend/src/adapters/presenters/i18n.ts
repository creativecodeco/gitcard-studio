export interface TranslationSet {
  stats: {
    commits: string;
    stars: string;
    followers: string;
    prs: string;
    issues: string;
    forks: string;
    techStackTitle?: string;
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

export const TRANSLATIONS: Record<'es' | 'en' | 'fr' | 'de' | 'pt' | 'ja' | 'zh', TranslationSet> =
  {
    es: {
      stats: {
        commits: 'Commits:',
        stars: 'Estrellas:',
        followers: 'Seguidores:',
        prs: 'PRs:',
        issues: 'Issues:',
        forks: 'Forks:'
      },
      languages: {
        title: 'Lenguajes Más Usados'
      },
      rank: {
        title: 'Rango de Desarrollador',
        collab: 'Índice de Colaboración',
        rankLegendary: 'Desarrollador Legendario / Contribuidor Elite',
        rankOutstanding: 'Desarrollador Sobresaliente / Muy Activo',
        rankActive: 'Desarrollador Activo y Colaborativo',
        rankGrowing: 'Desarrollador en crecimiento'
      },
      streak: {
        title: 'Racha de Contribuciones',
        current: 'Racha Actual',
        max: 'Racha Máxima',
        total: 'Total Contribuciones',
        days: 'días',
        noStreak: 'Sin racha activa',
        present: 'Presente'
      },
      trophies: {
        title: 'Trofeos de GitHub'
      },
      topRepos: {
        title: 'Top Repositorios',
        stars: 'por estrellas',
        noLicense: 'Sin Licencia'
      },
      sponsors: {
        title: 'Sponsors de GitHub',
        total: 'Total Sponsors:',
        monthly: 'Mensuales:',
        oneTime: 'Pago Único:',
        estMonthly: 'Est. Mensual:',
        noSponsors: 'Aún sin sponsors públicos',
        becomeSponsor: 'Sé un Sponsor'
      }
    },
    en: {
      stats: {
        commits: 'Commits:',
        stars: 'Stars:',
        followers: 'Followers:',
        prs: 'PRs:',
        issues: 'Issues:',
        forks: 'Forks:'
      },
      languages: {
        title: 'Most Used Languages'
      },
      rank: {
        title: 'Developer Rank',
        collab: 'Collaboration Index',
        rankLegendary: 'Legendary Developer / Elite Contributor',
        rankOutstanding: 'Outstanding Developer / Very Active',
        rankActive: 'Active & Collaborative Developer',
        rankGrowing: 'Growing Developer'
      },
      streak: {
        title: 'Contribution Streak',
        current: 'Current Streak',
        max: 'Longest Streak',
        total: 'Total Contributions',
        days: 'days',
        noStreak: 'No active streak',
        present: 'Present'
      },
      trophies: {
        title: 'GitHub Trophies'
      },
      topRepos: {
        title: 'Top Repositories',
        stars: 'by stars',
        noLicense: 'No License'
      },
      sponsors: {
        title: 'GitHub Sponsors',
        total: 'Total Sponsors:',
        monthly: 'Monthly:',
        oneTime: 'One-time:',
        estMonthly: 'Est. Monthly:',
        noSponsors: 'No public sponsors yet',
        becomeSponsor: 'Become a Sponsor'
      }
    },
    fr: {
      stats: {
        commits: 'Commits:',
        stars: 'Étoiles:',
        followers: 'Abonnés:',
        prs: 'PRs:',
        issues: 'Issues:',
        forks: 'Forks:'
      },
      languages: {
        title: 'Langages Les Plus Utilisés'
      },
      rank: {
        title: 'Rang de Développeur',
        collab: 'Indice de Collaboration',
        rankLegendary: 'Développeur Légendaire',
        rankOutstanding: 'Développeur Exceptionnel',
        rankActive: 'Développeur Actif',
        rankGrowing: 'Développeur En Croissance'
      },
      streak: {
        title: 'Série de Contributions',
        current: 'Série Actuelle',
        max: 'Série Maximale',
        total: 'Total Contributions',
        days: 'jours',
        noStreak: 'Aucune série active',
        present: 'Présent'
      },
      trophies: {
        title: 'Trophées GitHub'
      },
      topRepos: {
        title: 'Top Dépôts',
        stars: 'par étoiles',
        noLicense: 'Sans Licence'
      },
      sponsors: {
        title: 'Sponsors GitHub',
        total: 'Total Sponsors:',
        monthly: 'Mensuels:',
        oneTime: 'Paiement Unique:',
        estMonthly: 'Est. Mensuel:',
        noSponsors: 'Aucun sponsor public',
        becomeSponsor: 'Devenir Sponsor'
      }
    },
    de: {
      stats: {
        commits: 'Commits:',
        stars: 'Sterne:',
        followers: 'Follower:',
        prs: 'PRs:',
        issues: 'Issues:',
        forks: 'Forks:'
      },
      languages: {
        title: 'Meistgenutzte Sprachen'
      },
      rank: {
        title: 'Entwickler-Rang',
        collab: 'Kollaborations-Index',
        rankLegendary: 'Legendärer Entwickler',
        rankOutstanding: 'Hervorragender Entwickler',
        rankActive: 'Aktiver Entwickler',
        rankGrowing: 'Wachsender Entwickler'
      },
      streak: {
        title: 'Beitrags-Serie',
        current: 'Aktuelle Serie',
        max: 'Längste Serie',
        total: 'Gesamte Beiträge',
        days: 'Tage',
        noStreak: 'Keine aktive Serie',
        present: 'Heute'
      },
      trophies: {
        title: 'GitHub Trophäen'
      },
      topRepos: {
        title: 'Top Repositories',
        stars: 'nach Sternen',
        noLicense: 'Keine Lizenz'
      },
      sponsors: {
        title: 'GitHub Sponsoren',
        total: 'Gesamt Sponsoren:',
        monthly: 'Monatlich:',
        oneTime: 'Einmalig:',
        estMonthly: 'Est. Monatlich:',
        noSponsors: 'Noch keine öffentlichen Sponsoren',
        becomeSponsor: 'Sponsor werden'
      }
    },
    pt: {
      stats: {
        commits: 'Commits:',
        stars: 'Estrelas:',
        followers: 'Seguidores:',
        prs: 'PRs:',
        issues: 'Issues:',
        forks: 'Forks:'
      },
      languages: {
        title: 'Linguagens Mais Usadas'
      },
      rank: {
        title: 'Nível de Desenvolvedor',
        collab: 'Índice de Colaboração',
        rankLegendary: 'Desenvolvedor Lendário',
        rankOutstanding: 'Desenvolvedor Destaque',
        rankActive: 'Desenvolvedor Ativo',
        rankGrowing: 'Desenvolvedor em Crescimento'
      },
      streak: {
        title: 'Sequência de Contribuições',
        current: 'Sequência Atual',
        max: 'Maior Sequência',
        total: 'Total de Contribuições',
        days: 'dias',
        noStreak: 'Sem sequência ativa',
        present: 'Presente'
      },
      trophies: {
        title: 'Troféus do GitHub'
      },
      topRepos: {
        title: 'Principais Repositórios',
        stars: 'por estrelas',
        noLicense: 'Sem Licença'
      },
      sponsors: {
        title: 'Sponsors do GitHub',
        total: 'Total de Sponsors:',
        monthly: 'Mensais:',
        oneTime: 'Único:',
        estMonthly: 'Est. Mensal:',
        noSponsors: 'Nenhum sponsor público',
        becomeSponsor: 'Seja um Sponsor'
      }
    },
    ja: {
      stats: {
        commits: 'コミット:',
        stars: 'スター:',
        followers: 'フォロワー:',
        prs: 'PR:',
        issues: 'Issue:',
        forks: 'フォーク:'
      },
      languages: {
        title: '使用言語ランキング'
      },
      rank: {
        title: '開発者ランク',
        collab: 'コラボレーション指標',
        rankLegendary: '伝説的デベロッパー',
        rankOutstanding: '優秀なデベロッパー',
        rankActive: 'アクティブデベロッパー',
        rankGrowing: '成長中のデベロッパー'
      },
      streak: {
        title: 'コントリビューションストリーク',
        current: '現在のストリーク',
        max: '最長ストリーク',
        total: '総コントリビューション',
        days: '日',
        noStreak: 'アクティブなストリークなし',
        present: '現在'
      },
      trophies: {
        title: 'GitHub トロフィー'
      },
      topRepos: {
        title: '人気リポジトリ',
        stars: 'スター数順',
        noLicense: 'ライセンスなし'
      },
      sponsors: {
        title: 'GitHub スポンサー',
        total: 'スポンサー総数:',
        monthly: '月額:',
        oneTime: '単発:',
        estMonthly: '推定月額:',
        noSponsors: '公開スポンサーはまだありません',
        becomeSponsor: 'スポンサーになる'
      }
    },
    zh: {
      stats: {
        commits: '提交数:',
        stars: '获赞数:',
        followers: '关注者:',
        prs: 'PR数:',
        issues: 'Issue数:',
        forks: '复刻数:'
      },
      languages: {
        title: '最常用编程语言'
      },
      rank: {
        title: '开发者等级',
        collab: '协作指数',
        rankLegendary: '传奇级开发者',
        rankOutstanding: '卓越开发者',
        rankActive: '活跃开发者',
        rankGrowing: '成长中开发者'
      },
      streak: {
        title: '贡献连胜纪录',
        current: '当前连胜',
        max: '最长连胜',
        total: '总贡献数',
        days: '天',
        noStreak: '暂无活跃连胜',
        present: '至今'
      },
      trophies: {
        title: 'GitHub 奖杯成就'
      },
      topRepos: {
        title: '热门开源项目',
        stars: '按 Star 排序',
        noLicense: '未设定许可证'
      },
      sponsors: {
        title: 'GitHub 赞助者',
        total: '赞助者总数:',
        monthly: '按月赞助:',
        oneTime: '单次赞助:',
        estMonthly: '预估月收入:',
        noSponsors: '暂无公开赞助者',
        becomeSponsor: '成为赞助者'
      }
    }
  };

export function getTranslations(locale?: string): TranslationSet {
  const normalized = (locale || 'es').toLowerCase().trim();
  if (normalized in TRANSLATIONS) {
    return TRANSLATIONS[normalized as keyof typeof TRANSLATIONS];
  }
  return TRANSLATIONS.es;
}
