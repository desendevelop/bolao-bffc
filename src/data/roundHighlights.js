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
 * Os nomes exibidos vêm de quem mais e quem menos pontuou do início da copa
 * até o fim da rodada selecionada.
 */

import group1Leader from '../assets/highlights/group-1-leader.png'
import group1Umbral from '../assets/highlights/group-1-umbral.png'
import group1Article from '../content/highlights/group-1.md?raw'

export const ROUND_HIGHLIGHTS = {
  'group-1': {
    leaderImage: group1Leader,
    umbralImage: group1Umbral,
    leaderText: '',
    umbralText: '',
    article: group1Article,
  },
}

export function getStaticRoundHighlight(roundId) {
  return ROUND_HIGHLIGHTS[roundId] ?? null
}

export function isStaticHighlightPublished(content) {
  return Boolean(content?.leaderImage || content?.umbralImage || content?.article)
}
