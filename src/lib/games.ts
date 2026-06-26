/**
 * Référentiel partagé des jeux/catégories — source de vérité unique.
 * ──────────────────────────────────────────────────────────────────────────
 * Utilisé des DEUX côtés du marketplace pour que le filtre fonctionne :
 *   - créateur : `Profile.games` (renseigné dans l'éditeur media kit)
 *   - marque   : `Company.preferredGames` (profil marque) + filtre de l'annuaire
 *
 * On stocke le LIBELLÉ canonique (ex. "Valorant") directement dans les tableaux
 * `String[]` côté DB — lisible, et le filtre annuaire matche sur cette valeur.
 * Ajouter/retirer un jeu = éditer cette liste (aucune migration nécessaire).
 *
 * Inclut deux catégories non-jeu utiles aux streamers FR non mono-jeu :
 * "Variété (multi-jeux)" et "Just Chatting / IRL".
 */
export const GAMES: string[] = [
  'Valorant',
  'League of Legends',
  'Counter-Strike 2',
  'Fortnite',
  'Minecraft',
  'GTA V / GTA RP',
  'Call of Duty (Warzone)',
  'Rocket League',
  'Apex Legends',
  'Overwatch 2',
  'EA FC (FIFA)',
  'Teamfight Tactics',
  'World of Warcraft',
  'Rust',
  'Trackmania',
  'Dofus',
  'Dead by Daylight',
  'Marvel Rivals',
  'Palworld',
  'Elden Ring',
  'Among Us',
  'Fall Guys',
  'Variété (multi-jeux)',
  'Just Chatting / IRL',
]

/** Vérifie qu'un libellé fait partie du référentiel (validation entrées API). */
export function isKnownGame(game: string): boolean {
  return GAMES.includes(game)
}
