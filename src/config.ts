/** Configuração compartilhada entre o site e os scripts de conversão. */
export const SITE = 'https://henriquealvarenga.com';
export const BASE = '/robert-lowell';
export const SITE_URL = `${SITE}${BASE}/`;
export const OLD_SITE_URL = `${SITE}/RobertLowell/`;

export const TITLE = 'A Jornada de Lowell';
export const SUBTITLE = 'A história do transtorno bipolar do poeta Robert Lowell (1917–1977)';
export const DESCRIPTION =
  'Experiência interativa sobre a trajetória do transtorno bipolar do poeta Robert Lowell: as crises, as internações, a chegada do lítio e a história familiar. Baseado em Kay R. Jamison, "Setting the River on Fire". Para estudantes de psiquiatria e psicologia.';

export const AUTHOR = {
  name: 'Henrique Alvarenga da Silva',
  display: 'Dr. Henrique Alvarenga da Silva',
  role: 'Médico Psiquiatra',
  crm: 'CRM-MG 31.778',
  rqe: 'RQE 8381',
  url: 'https://henriquealvarenga.com',
  orcid: 'https://orcid.org/0000-0001-9799-5240',
  links: [
    { label: 'Lattes', href: 'https://lattes.cnpq.br/6147640440978297' },
    { label: 'ORCID', href: 'https://orcid.org/0000-0001-9799-5240' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/henriquealvarengasilva' },
    { label: 'Instagram', href: 'https://www.instagram.com/henriquealvarengadasilva' },
  ],
};

/** Caminho absoluto (com base) para uma rota do site. */
export const href = (path: string) => `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
