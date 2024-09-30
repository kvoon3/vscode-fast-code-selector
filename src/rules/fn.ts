import type { ArrowFunctionExpression, ClassMethod, FunctionDeclaration } from '@babel/types'
import type { TextDocument } from 'vscode'
import type { ParserRes } from '../parser'
import traverse from '@babel/traverse'
import { Selection } from 'vscode'
import { logger } from '../utils'

export type Handler<T extends string | number | symbol = string> = (ctx: ParserRes & { selection: Selection, doc: TextDocument }) => Record<T, Selection | undefined> | undefined

const supportedNodeType = [
  'FunctionDeclaration',
  'ArrowFunctionExpression',
  'ClassMethod',
]

export const fnHandler: Handler<'expression' | 'returnStatement' | 'body'> = (ctx) => {
  if (!ctx || !ctx.ast)
    return

  const { ast, doc, selection, start: offset } = ctx

  let expression: Selection | undefined
  let expressionBody: Selection | undefined
  let returnStatement: Selection | undefined

  traverse(ast, {
    enter(path) {
      if (path.node.start == null || path.node.end == null)
        return

      if (!supportedNodeType.includes(path.node.type)) {
        // logger.info(`[js-arrow-fn] Unknown ${path.node.type}`)
        return
      }

      logger.info('----------------------')

      const {
        node: {
          start,
          end,
        },
      } = path

      const fnSelection = new Selection(
        doc.positionAt(start! + offset),
        doc.positionAt(end! + offset),
      )

      if (
        fnSelection.start.isBeforeOrEqual(selection.active)
        && fnSelection.end.isAfterOrEqual(selection.active)
      ) {
        const expressionNode = path.node as FunctionDeclaration | ClassMethod | ArrowFunctionExpression
        const expressionBodyNode = expressionNode.body
        const returnStatementNode = expressionBodyNode.type === 'BlockStatement'
          ? expressionBodyNode.body.find(i => i.type === 'ReturnStatement')
          : expressionBodyNode

        expression = new Selection(
          doc.positionAt(path.node.start + offset),
          doc.positionAt(path.node.end + offset),
        )

        if (expressionBodyNode.start && expressionBodyNode.end) {
          expressionBody = new Selection(
            doc.positionAt(expressionBodyNode.start + offset),
            doc.positionAt(expressionBodyNode.end + offset),
          )
        }

        if (returnStatementNode?.start && returnStatementNode?.end) {
          returnStatement = new Selection(
            doc.positionAt(returnStatementNode.start + offset),
            doc.positionAt(returnStatementNode.end + offset),
          )
        }
        else {
          returnStatement = expressionBody
        }

        logger.info('expression', JSON.stringify(expression, null, 2))
      }
      else {
        logger.info('skip')
        return path.skip()
      }
    },
  })

  return {
    expression,
    body: expressionBody,
    returnStatement,
  }
}
