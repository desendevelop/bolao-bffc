/**
 * Destaques estáticos por rodada (versionados no GitHub).
 *
 * Para publicar uma rodada:
 * 1. Coloque as imagens em src/assets/highlights/
 *    Ex.: group-1-leader.jpg, group-1-umbral.jpg
 * 2. Importe as imagens e o artigo (.md) abaixo e preencha o bloco da rodada
 * 3. Commit + push → GitHub Pages atualiza sozinho
 *
 * As imagens e textos são personalizados por você.
 * Os nomes exibidos vêm de quem mais e quem menos pontuou só nos jogos da rodada.
 */

import group1Leader from '../assets/highlights/group-1-leader.png'
import group1Umbral from '../assets/highlights/group-1-umbral.png'
import group1Article from '../content/highlights/group-1.md?raw'
import group2Leader from '../assets/highlights/group-2-leader.png'
import group2Umbral from '../assets/highlights/group-2-umbral.png'
import group2Article from '../content/highlights/group-2.md?raw'
import group3Leader from '../assets/highlights/group-3-leader.png'
import group3Umbral from '../assets/highlights/group-3-umbral.png'
import group3Article from '../content/highlights/group-3.md?raw'

export const ROUND_HIGHLIGHTS = {
  'group-1': {
    leaderImage: group1Leader,
    umbralImage: group1Umbral,
    leaderText: '',
    umbralText: '',
    article: group1Article,
  },
  'group-2': {
    leaderImage: group2Leader,
    umbralImage: group2Umbral,
    leaderText: '',
    umbralText: '',
    article: group2Article,
  },
  'group-3': {
    leaderImage: group3Leader,
    umbralImage: group3Umbral,
    leaderText: '',
    umbralText: '',
    article: group3Article,
  },
}

export function getStaticRoundHighlight(roundId) {
  return ROUND_HIGHLIGHTS[roundId] ?? null
}

export function isStaticHighlightPublished(content) {
  return Boolean(content?.leaderImage || content?.umbralImage || content?.article)
}
