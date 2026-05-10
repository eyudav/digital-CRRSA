export const ADDIS_SUBCITY_WOREDA_COUNTS = {
  "Addis Ketema": 10,
  "Akaky Kaliti": 13,
  Arada: 10,
  Bole: 14,
  Gullele: 10,
  Kirkos: 11,
  "Kolfe Keranio": 15,
  "Lemi Kura": 12,
  Lideta: 10,
  "Nifas Silk-Lafto": 12,
  Yeka: 13,
};

export const ADDIS_SUBCITIES = Object.keys(ADDIS_SUBCITY_WOREDA_COUNTS);

export function getWoredasForSubCity(subCity) {
  const count = ADDIS_SUBCITY_WOREDA_COUNTS[subCity] || 0;
  return Array.from({ length: count }, (_, i) => `Woreda ${i + 1}`);
}
