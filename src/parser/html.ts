import type { ParserContext } from '.'
import { parse, SyntaxKind, walk } from 'html5parser'
import { logger } from '../utils'
import { parseJS } from './javascript'

export function parseHTML(ctx: ParserContext) {
  const { langId, raw } = ctx

  if (!['html', 'vue'].includes(langId))
    return

  let res: ReturnType<typeof parseJS> | undefined

  try {
    walk(parse(raw), {
      enter(node) {
        if (node.type === SyntaxKind.Tag
          && node.name === 'script'
        ) {
          node.body?.forEach((i) => {
            if (i.type !== SyntaxKind.Text)
              return

            res = parseJS({
              langId: 'javascript',
              raw: i.value,
              start: i.start,
            })
          })
        }
      },
    })
  }
  catch (error) {
    logger.error('error', error)
  }

  return res
}
