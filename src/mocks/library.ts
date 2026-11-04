import type { AlbumStat, Artist, ArtistStat, MusicLibrary, TrackStat } from "@/domain/types";
import { demoSource } from "@/domain/sources";

// Todo es ficticio. Los ratios minutos/reproducciones varían a propósito (canciones cortas, piezas largas)
// para que ordenar por reproducciones o por tiempo dé rankings distintos.
const a = (id: string, name: string, ...genres: string[]): Artist => ({ id, name, genres });
const A = {
  marea: a("a1", "Marea Alta Club", "indie pop", "dream pop"),
  neon: a("a2", "Noche de Neón", "synthwave"),
  cora: a("a3", "Cora Ventura", "pop latino"),
  faroles: a("a4", "Los Faroles", "rock alternativo"),
  pajaro: a("a5", "Pájaro Eléctrico", "indie rock"),
  sol: a("a6", "Sol Nómada", "folk"),
  bruma: a("a7", "Bruma", "electrónica"),
  delta: a("a8", "Delta Cinco", "hip hop"),
  ona: a("a9", "Ona Verde", "neo soul"),
  kiosko: a("a10", "Kiosko Lunar", "lo-fi"),
  tormenta: a("a11", "Tormenta Dulce", "punk pop"),
  alba: a("a12", "Alba Cuántica", "ambient"),
  pixel: a("a13", "Pixel Mariachi", "chiptune"),
  mini: a("a14", "Mini Mínimo", "punk"),
  vals: a("a15", "Vals de Bolsillo", "neoclásica"),
  costa: a("a16", "Costa Cinema", "bossa nova"),
  replica: a("a17", "Réplica", "trap"),
  humo: a("a18", "Humo Blanco", "post-rock"),
  radio: a("a19", "Radio Cometa", "pop"),
  gato: a("a20", "Gato Maracas", "cumbia"),
};

const as = (artist: Artist, minutes: number, plays: number, firstPlayedAt: string): ArtistStat => ({ artist, minutes, plays, firstPlayedAt });
const ts = (id: string, name: string, artist: Artist, plays: number, minutes: number): TrackStat => ({
  track: { id, name, artistId: artist.id },
  artistName: artist.name,
  plays,
  minutes,
});
const bs = (id: string, name: string, artist: Artist, plays: number, minutes: number): AlbumStat => ({
  album: { id, name, artistId: artist.id },
  artistName: artist.name,
  plays,
  minutes,
});

export const mockLibrary: MusicLibrary = {
  source: demoSource,
  artists: [
    as(A.marea, 3120, 912, "2021-03-08"),
    as(A.neon, 2740, 801, "2022-07-19"),
    as(A.cora, 2310, 640, "2020-11-02"),
    as(A.faroles, 1980, 560, "2019-05-24"),
    as(A.pajaro, 1675, 498, "2023-01-15"),
    as(A.sol, 1420, 402, "2022-04-30"),
    as(A.bruma, 1190, 340, "2024-02-11"),
    as(A.delta, 1040, 301, "2021-09-06"),
    as(A.pixel, 900, 410, "2022-12-03"),
    as(A.mini, 760, 520, "2023-06-17"),
    as(A.vals, 690, 150, "2024-08-21"),
    as(A.costa, 640, 190, "2021-02-14"),
    as(A.replica, 580, 330, "2025-01-09"),
    as(A.humo, 540, 95, "2020-10-30"),
    as(A.radio, 505, 240, "2023-03-12"),
    as(A.gato, 470, 260, "2025-05-22"),
    as(A.ona, 215, 58, "2026-09-14"),
    as(A.kiosko, 188, 67, "2026-10-02"),
    as(A.tormenta, 142, 44, "2026-10-21"),
    as(A.alba, 96, 31, "2026-10-30"),
  ],
  tracks: [
    ts("t1", "Autopista a medianoche", A.neon, 188, 640),
    ts("t2", "Verano en diferido", A.marea, 171, 582),
    ts("t3", "Cartas sin remitente", A.cora, 163, 538),
    ts("t4", "Ceniza y miel", A.faroles, 149, 507),
    ts("t5", "Pasos en la arena", A.sol, 137, 466),
    ts("t6", "Satélite", A.bruma, 128, 435),
    ts("t7", "Doble o nada", A.delta, 119, 405),
    ts("t8", "Corriente", A.pajaro, 112, 381),
    ts("t9", "Pixel de medianoche", A.pixel, 160, 336),
    ts("t10", "Dos minutos", A.mini, 155, 295),
    ts("t11", "Uno, dos, tres", A.mini, 140, 280),
    ts("t12", "Cuarenta kilómetros", A.humo, 38, 361),
    ts("t13", "Tarde de sábado", A.costa, 70, 266),
    ts("t14", "Estación Sur", A.vals, 52, 364),
    ts("t15", "Efecto mariposa", A.replica, 98, 284),
    ts("t16", "Cometa", A.radio, 90, 279),
    ts("t17", "Cumbia del trueno", A.gato, 85, 281),
    ts("t18", "Ladrillo y sal", A.faroles, 90, 360),
    ts("t19", "Eco de cobre", A.sol, 88, 317),
    ts("t20", "Última parada", A.marea, 99, 356),
  ],
  albums: [
    bs("b1", "Costas de papel", A.marea, 475, 1620),
    bs("b2", "Luces de peaje", A.neon, 420, 1450),
    bs("b3", "Correspondencia", A.cora, 335, 1210),
    bs("b4", "Ceniza", A.faroles, 310, 1100),
    bs("b5", "Madrugada eléctrica", A.pajaro, 270, 905),
    bs("b6", "Camino de tierra", A.sol, 230, 820),
    bs("b7", "Órbita baja", A.bruma, 205, 700),
    bs("b8", "Doble fondo", A.delta, 190, 640),
    bs("b9", "Ocho bits", A.pixel, 235, 520),
    bs("b10", "Tres acordes", A.mini, 330, 480),
    bs("b11", "Humo", A.humo, 70, 410),
    bs("b12", "Mapa de bolsillo", A.vals, 85, 390),
  ],
};

export function getArtistStat(id: string): ArtistStat {
  const found = mockLibrary.artists.find((item) => item.artist.id === id);
  if (!found) throw new Error(`Mock: artista no encontrado (${id})`);
  return found;
}
