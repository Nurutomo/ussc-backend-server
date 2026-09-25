export enum MODES {
  PJU = 'pju',
  KWH = 'kwh',
  INDOOR = 'indoor',
  TREE = 'tree',
  PJU_LUAR = 'pju_luar',
}

export const MODES_FORMAT = {
  pju: { label: 'PJU Hutan', lux: true },
  kwh: { label: 'kWH Meter' },
  indoor: { label: 'Titik Lampu Indoor' },
  tree: { label: 'Tanaman Hutan' },
  pju_luar: { label: 'PJU Luar', lux: true },
}

export enum CONDITIONS {
  GELAP = 'Gelap',
  REDUP = 'Redup',
  TERANG = 'Terang',
}

export const COLORS = {
  Gelap: ['#ef4444', '#b91c1c'],
  Redup: ['#eab308', '#a16207'],
  Terang: ['#22c55e', '#15803d'],
}
