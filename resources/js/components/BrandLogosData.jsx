import React from 'react';

// ─── Crisp Vector Logos for Job Portals ─────────────────────────────────────
export const JOB_PORTALS = [
  {
    name: 'loker.id',
    tag: 'Scraping Ingestion',
    url: 'https://www.loker.id/',
    logo: (
      <div className="flex items-center gap-1.5 font-sans select-none">
        <div className="w-6 h-6 rounded-md bg-[#FF5722] flex items-center justify-center text-white font-black text-xs">
          L
        </div>
        <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">
          loker<span className="text-[#FF5722]">.id</span>
        </span>
      </div>
    ),
  },
  {
    name: 'JobStreet',
    tag: '10K+ Lowongan',
    url: 'https://www.jobstreet.co.id/',
    logo: (
      <div className="flex items-center gap-1 font-sans select-none">
        <svg className="w-5 h-5 text-[#1C3F94]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2v-4h2v4zm0-6h-2v-2h2v2z"/>
        </svg>
        <span className="font-black text-base tracking-tight text-[#1C3F94] dark:text-[#3860C4]">JobStreet</span>
        <span className="text-[9px] text-gray-400 dark:text-gray-400 font-semibold ml-0.5">by SEEK</span>
      </div>
    ),
  },
  {
    name: 'Glints',
    tag: 'Tech SEA',
    url: 'https://glints.com/id',
    logo: (
      <div className="flex items-center gap-1.5 font-sans select-none">
        <div className="w-6 h-6 rounded-full bg-[#EC273B] flex items-center justify-center text-white font-black text-[10px]">
          G
        </div>
        <span className="font-black text-base tracking-wider text-[#EC273B]">GLINTS</span>
      </div>
    ),
  },
  {
    name: 'LinkedIn',
    tag: 'Talent Directory',
    url: 'https://www.linkedin.com/jobs',
    logo: (
      <div className="flex items-center gap-1.5 font-sans select-none">
        <svg className="w-6 h-6 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
        </svg>
        <span className="font-bold text-base text-gray-900 dark:text-white tracking-tight">LinkedIn</span>
      </div>
    ),
  },
  {
    name: 'Indeed',
    tag: 'Global Engine',
    url: 'https://id.indeed.com/',
    logo: (
      <div className="flex items-center gap-1 font-sans select-none">
        <svg className="w-5 h-5 text-[#2164f3]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2 15h-2v-6h2v6zm-1-7.5c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
        </svg>
        <span className="font-extrabold text-base tracking-tighter text-[#2164f3]">indeed</span>
      </div>
    ),
  },
  {
    name: 'Kalibrr',
    tag: 'Vokasi & Kampus',
    url: 'https://www.kalibrr.com/',
    logo: (
      <div className="flex items-center gap-1.5 font-sans select-none">
        <div className="w-6 h-6 rounded-lg bg-[#4A148C] text-white flex items-center justify-center font-black text-xs shadow-xs">
          K
        </div>
        <span className="font-black text-base text-[#4A148C] dark:text-[#A855F7] tracking-tight">kalibrr</span>
      </div>
    ),
  },
  {
    name: 'Tech in Asia',
    tag: 'Startup Jobs',
    url: 'https://www.techinasia.com/jobs',
    logo: (
      <div className="flex items-center gap-1.5 font-sans select-none">
        <div className="w-6 h-6 rounded bg-[#E53935] flex items-center justify-center text-white font-black text-[10px]">
          TIA
        </div>
        <span className="font-black text-sm text-gray-900 dark:text-white tracking-tight">TECH IN ASIA</span>
      </div>
    ),
  },
  {
    name: 'Karir.com',
    tag: 'Bursa Industri',
    url: 'https://www.karir.com/',
    logo: (
      <div className="flex items-center gap-1.5 font-sans select-none">
        <svg className="w-5 h-5 text-[#00838F]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
        </svg>
        <span className="font-extrabold text-base text-[#00838F] tracking-tight">karir<span className="text-gray-900 dark:text-white">.com</span></span>
      </div>
    ),
  },
  {
    name: 'Dealls',
    tag: 'Top Talent',
    url: 'https://dealls.com/',
    logo: (
      <div className="flex items-center gap-1.5 font-sans select-none">
        <div className="w-6 h-6 rounded-full bg-[#059669] flex items-center justify-center text-white font-black text-xs">
          D
        </div>
        <span className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight">Dealls</span>
      </div>
    ),
  },
];

// ─── Real Vector Tech Icons for Industry Skills ─────────────────────────────
export const TECH_SKILLS = [
  {
    name: 'Docker',
    growth: '+28% Demand',
    color: '#0db7ed',
    url: 'https://docs.docker.com/',
    icon: (
      <svg className="w-4 h-4 text-[#0db7ed]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.186.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186H5.136a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185m-2.928 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186H2.208a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185"/>
      </svg>
    ),
  },
  {
    name: 'Kubernetes',
    growth: '+34% Demand',
    color: '#326ce5',
    url: 'https://kubernetes.io/docs/',
    icon: (
      <svg className="w-4 h-4 text-[#326ce5]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7.8v11.4L12 22l10-4.8V7.8L12 2zm0 3.2l6.8 3.9-2.7 1.6-4.1-2.4-4.1 2.4-2.7-1.6L12 5.2z"/>
      </svg>
    ),
  },
  {
    name: 'React 19',
    growth: '+22% Demand',
    color: '#61dafb',
    url: 'https://react.dev/',
    icon: (
      <svg className="w-4 h-4 text-[#61dafb]" viewBox="0 0 24 24" fill="currentColor">
        <ellipse cx="12" cy="12" rx="4" ry="11" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(30 12 12)"/>
        <ellipse cx="12" cy="12" rx="4" ry="11" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(90 12 12)"/>
        <ellipse cx="12" cy="12" rx="4" ry="11" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(150 12 12)"/>
        <circle cx="12" cy="12" r="2" fill="currentColor"/>
      </svg>
    ),
  },
  {
    name: 'Laravel',
    growth: '+18% Demand',
    color: '#ff2d20',
    url: 'https://laravel.com/docs',
    icon: (
      <svg className="w-4 h-4 text-[#ff2d20]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.2l6.8 3.8L12 11.8 5.2 8 12 4.2zM5 9.8l6 3.3v6.7l-6-3.3V9.8zm8 10v-6.7l6-3.3v6.7l-6 3.3z"/>
      </svg>
    ),
  },
  {
    name: 'PostgreSQL',
    growth: '+25% Demand',
    color: '#336791',
    url: 'https://www.postgresql.org/docs/',
    icon: (
      <svg className="w-4 h-4 text-[#336791]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    ),
  },
  {
    name: 'Cloud AWS',
    growth: '+31% Demand',
    color: '#ff9900',
    url: 'https://docs.aws.amazon.com/',
    icon: (
      <svg className="w-4 h-4 text-[#ff9900]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.8 14.5c-.3-.2-.7-.4-1.2-.4-.9 0-1.5.6-1.5 1.5 0 .9.6 1.5 1.5 1.5.5 0 .9-.2 1.2-.4l.3.9c-.4.3-1 .5-1.7.5-1.6 0-2.6-1.1-2.6-2.6s1-2.6 2.6-2.6c.7 0 1.3.2 1.7.5l-.3 1.1zm-8.2 3.4h-1.3l-2.1-7.2h1.4l1.4 5.3 1.4-5.3h1.4l-2.2 7.2zm11.1.5c-3.2 2.3-7.8 3.6-11.8 3.6-5.6 0-10.6-2.1-14.4-5.6l.8-.7c3.6 3.3 8.3 5.3 13.6 5.3 3.8 0 8.1-1.2 11.2-3.3l.6.7z"/>
      </svg>
    ),
  },
  {
    name: 'Redis',
    growth: '+19% Demand',
    color: '#d82c20',
    url: 'https://redis.io/docs/',
    icon: (
      <svg className="w-4 h-4 text-[#d82c20]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zm0 8l-8-4v6l8 4 8-4v-6l-8 4zm0 6l-8-4v6l8 4 8-4v-6l-8 4z"/>
      </svg>
    ),
  },
  {
    name: 'CI/CD Pipelines',
    growth: '+26% Demand',
    color: '#10b981',
    url: 'https://docs.github.com/en/actions',
    icon: (
      <svg className="w-4 h-4 text-[#10b981]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5a2.5 2.5 0 0 1-5 0V11a2.5 2.5 0 0 1 5 0zm3-4.5a2.5 2.5 0 0 1-5 0V7.5a2.5 2.5 0 0 1 5 0z"/>
      </svg>
    ),
  },
];
