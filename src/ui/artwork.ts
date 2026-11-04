/** Utilidades visuales compartidas por Avatar y ArtistImage. */

export const gradients = [
  "from-flare-400 to-sun-400",
  "from-iris-500 to-flare-400",
  "from-iris-400 to-sun-400",
  "from-flare-500 to-iris-500",
  "from-sun-400 to-iris-400",
];

/** Hash estable (entero sin signo) a partir de un texto. */
export function hashString(value: string) {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

/** Gradiente estable a partir del nombre: el mismo nombre siempre da el mismo color. */
export const gradientFor = (name: string) => gradients[hashString(name) % gradients.length];
