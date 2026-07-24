export type SupportedLocale = 'es' | 'en';

export function createFrontendTranslations(isEnglish: boolean) {
  return {
    // Configuration panel
    settings_title: isEnglish ? "Configuration" : "Configuración",
    username_label: isEnglish ? "GitHub Username" : "Usuario de GitHub",
    username_placeholder: isEnglish ? "e.g. github" : "ej. github",
    repo_label: isEnglish ? "Specific Repository (Optional)" : "Repositorio Específico (Opcional)",
    repo_placeholder: isEnglish ? "e.g. github-helpers (or the most popular)" : "ej. github-helpers (o el más popular)",
    btn_generate: isEnglish ? "Generate Cards" : "Generar Tarjetas",
    theme_label: isEnglish ? "Select a Style" : "Selecciona un Estilo",
    card_width_label: isEnglish ? "Card Width" : "Ancho de Tarjeta",
    width_standard: isEnglish ? "Standard (495px)" : "Estándar (495px)",
    width_full: isEnglish ? "Full Width (100%)" : "Ancho Completo (100%)",
    custom_width_placeholder: isEnglish ? "Custom, e.g. 600" : "Personalizado, ej: 600",
    btn_apply: isEnglish ? "Apply" : "Aplicar",
    locale_label: isEnglish ? "Card Language" : "Idioma de Tarjetas",
    locale_es: "Español (es)",
    locale_en: "English (en)",
    preview_title: isEnglish ? "Live Preview" : "Vista Previa",
    header_subtitle: isEnglish
      ? "Boost your project visibility. Generate aesthetic real-time metrics and cards for your README.md."
      : "Potencia la visibilidad de tus proyectos. Genera métricas y tarjetas estéticas en caliente para tu README.md.",
    header_metrics_label: isEnglish ? "Users active with cards: " : "Usuarios usando las cards: ",

    // Sample README elements
    sample_readme_title: isEnglish ? "Sample README.md" : "README.md de Ejemplo",
    sample_readme_desc: isEnglish
      ? "Complete template ready to copy and paste into your GitHub profile repository."
      : "Plantilla completa lista para copiar e insertar en tu repositorio de perfil.",
    btn_copy_sample_readme: isEnglish ? "Copy Full README.md" : "Copiar README.md Completo",
    profile_help_link: isEnglish ? "How to create your GitHub profile?" : "¿Cómo crear tu perfil en GitHub?",
    sample_readme_placeholder: isEnglish
      ? "Generate your cards to preview your custom sample README.md..."
      : "Genera tus tarjetas para ver el README.md de ejemplo...",
    readme_layout_label: isEnglish ? "Layout:" : "Diseño:",
    readme_layout_vertical: "Vertical",
    readme_layout_grid: isEnglish ? "Table (2 Col)" : "Tabla (2 Col)",
    tab_readme_code: isEnglish ? "Markdown Code" : "Código Markdown",
    tab_readme_preview: isEnglish ? "Live Preview" : "Vista Previa Live",

    // Card titles & labels
    title_views: isEnglish ? "Profile Views Counter Badge" : "Contador de Visitas del Perfil",
    code_label_views: isEnglish ? "Views Counter" : "Contador de Visitas",
    title_stats: isEnglish ? "General Statistics" : "Estadísticas Generales",
    code_label_stats: isEnglish ? "General Statistics" : "Estadísticas Generales",
    title_languages: isEnglish ? "Most Used Languages" : "Lenguajes más Usados",
    code_label_languages: isEnglish ? "Most Used Languages" : "Lenguajes más Usados",
    title_streak: isEnglish ? "Commit Streak" : "Racha de Commits",
    code_label_streak: isEnglish ? "Commit Streak" : "Racha de Commits",
    title_trophies: isEnglish ? "GitHub Trophies" : "Trofeos de GitHub",
    code_label_trophies: isEnglish ? "GitHub Trophies" : "Trofeos de GitHub",
    title_top_repos: isEnglish ? "Top Repositories" : "Top Repositorios",
    code_label_top_repos: isEnglish ? "Top Repositories" : "Top Repositorios",
    title_rank: isEnglish ? "Developer Rank" : "Rango de Desarrollador",
    title_repo: isEnglish ? "Featured Repository" : "Repositorio Destacado",
    placeholder_msg: isEnglish
      ? "Enter your GitHub username to load the preview"
      : "Ingresa tu usuario de GitHub para cargar la vista previa",
    copy_btn: isEnglish ? "Copy" : "Copiar",

    // Footer elements
    footer_rights: isEnglish ? "All rights reserved." : "Todos los derechos reservados.",
    footer_help: isEnglish ? "Help" : "Ayuda",
    footer_privacy: isEnglish ? "Privacy" : "Privacidad",

    // Private stats elements
    private_stats_title: isEnglish ? "Private Statistics" : "Estadísticas Privadas",
    private_stats_desc: isEnglish
      ? "To include your private repositories, register a Personal Access Token (PAT). Your data is encrypted on the server."
      : "Para incluir tus repositorios privados, registra un Personal Access Token (PAT). Tus datos se cifran en el servidor.",
    private_stats_guide: isEnglish ? "Read Help Guide →" : "Leer Guía de Ayuda →",
    private_stats_username: isEnglish ? "GitHub Username" : "Usuario de GitHub",
    private_stats_pat: "Personal Access Token (PAT)",
    private_stats_consent: isEnglish
      ? "I agree that this application saves my encrypted token in its database to query my statistics. I can revoke it at any time."
      : "Acepto que esta aplicación guarde mi token cifrado en su base de datos para consultar mis estadísticas. Puedo revocarlo cuando quiera.",
    private_stats_register_btn: isEnglish ? "Register Token" : "Registrar Token",
    private_stats_active_label: isEnglish ? "Active Registered Token" : "Token Registrado Activo",
    private_stats_active_desc: isEnglish
      ? "Your private repositories are now included in the queries."
      : "Tus repositorios privados ya se están sumando en las consultas.",
    private_stats_revoke_label: isEnglish ? "Enter your token to confirm revocation" : "Introduce tu token para confirmar revocación",
    private_stats_revoke_btn: isEnglish ? "Revoke Token" : "Revocar Token",
    private_stats_purge_label: isEnglish ? "Do you want to delete your entire record permanently?" : "¿Deseas eliminar todo tu registro de forma permanente?",
    private_stats_purge_open_btn: isEnglish ? "Delete all my data" : "Eliminar todos mis datos",

    // Purge modal elements
    purge_modal_title: isEnglish ? "Delete all my data" : "Eliminar todos mis datos",
    purge_modal_desc: isEnglish
      ? "This action is permanent and irreversible. It will delete your encrypted token, your statistics history, your card consumption metrics, and all your log records from the server."
      : "Esta acción es permanente e irreversible. Eliminará tu token cifrado, tu historial de estadísticas, tus métricas de consumo de cards y todos tus registros de logs del servidor.",
    purge_modal_confirm_label: isEnglish ? "Type your GitHub username to confirm" : "Escribe tu usuario de GitHub para confirmar",
    purge_modal_token_label: isEnglish ? "Enter your Access Token to authorize" : "Introduce tu Token de Acceso para autorizar",
    purge_modal_cancel_btn: isEnglish ? "Cancel" : "Cancelar",
    purge_modal_confirm_btn: isEnglish ? "Permanently delete everything" : "Eliminar todo definitivamente",

    // Dynamic Notifications & Toast Messages
    msg_network_error: isEnglish
      ? "Network error trying to communicate with the server."
      : "Error de red al intentar comunicarse con el servidor.",
    msg_copy_readme_success: isEnglish
      ? "Sample README.md copied to clipboard successfully!"
      : "¡README.md de ejemplo copiado al portapapeles con éxito!",
    msg_copy_readme_error: isEnglish
      ? "Failed to copy sample README to clipboard"
      : "Error al copiar el README de ejemplo al portapapeles",
    msg_copy_code_success: isEnglish ? "Code copied to clipboard successfully" : "Código copiado al portapapeles con éxito",
    msg_copy_code_error: isEnglish ? "Failed to copy to clipboard" : "Error al copiar al portapapeles",

    // Form Validation & Status Messages
    msg_enter_username: isEnglish ? "Please enter your GitHub username." : "Por favor, ingresa tu usuario de GitHub.",
    msg_enter_token: isEnglish ? "Please enter your Personal Access Token (PAT)." : "Por favor, ingresa tu Personal Access Token (PAT).",
    msg_accept_consent: isEnglish ? "You must accept the encrypted data storage consent." : "Debes aceptar el almacenamiento cifrado de datos.",
    msg_register_token_error: isEnglish ? "Error registering token." : "Error al registrar el token.",
    msg_no_registered_user: isEnglish ? "No registered user recognized." : "No se reconoce ningún usuario registrado.",
    msg_token_required_revoke: isEnglish
      ? "You must enter a valid GitHub token of yours to verify ownership before revoking."
      : "Debes ingresar un token de GitHub válido tuyo para verificar tu propiedad antes de revocar.",
    msg_revoke_token_error: isEnglish ? "Error revoking token." : "Error al revocar el token.",
    msg_purge_error: isEnglish ? "Failed to purge data." : "Error al intentar purgar los datos.",

    // Live README HTML preview
    readme_preview_greeting: isEnglish ? "Hi there, I'm @{username} 👋" : "¡Hola! Soy @{username} 👋",
    readme_preview_welcome: isEnglish ? "Welcome to my GitHub profile!" : "Bienvenido/a a mi perfil de GitHub.",
    readme_preview_desc: isEnglish
      ? "Welcome to my GitHub profile! Here are some of my automated GitHub stats:"
      : "Bienvenido/a a mi perfil de GitHub. Aquí puedes ver algunas de mis estadísticas de GitHub en tiempo real:",
    readme_preview_section_title: isEnglish ? "📊 GitHub Stats" : "📊 Estadísticas de GitHub",
    readme_preview_footer: isEnglish
      ? "⚡ Real-time generated GitHub stats cards"
      : "⚡ Tarjetas de estadísticas de GitHub generadas en tiempo real"
  };
}

export const TRANSLATIONS = {
  es: createFrontendTranslations(false),
  en: createFrontendTranslations(true)
};

export type TranslationKey = keyof typeof TRANSLATIONS.es;

/**
 * Gets a localized translation string by key for the specified locale.
 * Supports string interpolation via `{paramName}`.
 */
export function t(
  key: TranslationKey,
  locale: string = 'es',
  params?: Record<string, string>
): string {
  const lang = (locale in TRANSLATIONS ? locale : 'es') as SupportedLocale;
  const dict = TRANSLATIONS[lang];
  let text: string = dict[key] || TRANSLATIONS.es[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replaceAll(`{${paramKey}}`, paramVal);
    });
  }

  return text;
}

/**
 * Updates DOM elements containing `[data-i18n]` and `[data-i18n-placeholder]`.
 */
export function updateDomTranslations(locale: string = 'es'): void {
  const lang = (locale in TRANSLATIONS ? locale : 'es') as SupportedLocale;
  const dict = TRANSLATIONS[lang];

  // 1. Text elements
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const key = htmlEl.dataset.i18n;
    if (key && key in dict) {
      htmlEl.textContent = dict[key as TranslationKey];
    }
  });

  // 2. Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const key = htmlEl.dataset.i18nPlaceholder;
    if (key && key in dict) {
      (htmlEl as HTMLInputElement).placeholder = dict[key as TranslationKey];
    }
  });
}
