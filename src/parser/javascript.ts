import type { ParserContext } from '.'
import { parse } from '@babel/parser'
import { logger } from '../utils'

export function parseJS(ctx: ParserContext) {
  const { langId, raw, start = 0 } = ctx

  if (!['typescript', 'javascript'].includes(langId))
    return

  let ast: ReturnType<typeof parse> | undefined

  try {
    ast = parse(raw, {
      sourceType: 'unambiguous',
      plugins: [
        'typescript',
      ],
    })
  }
  catch (error) {
    logger.error('parse error', error)
  }

  return {
    type: 'javascript',
    ast,
    raw,
    start,
  } as const
}
