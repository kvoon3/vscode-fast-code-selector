import type { BlockStatement, Node, ReturnStatement } from '@babel/types'
import type { TextDocument } from 'vscode'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import { computed, defineExtension, useActiveTextEditor, useCommand, useDocumentText, useTextEditorSelection } from 'reactive-vscode'
import { Position, Range, Selection } from 'vscode'
import { commands } from './generated/meta'
import { logger } from './utils'

type FnOperator = (nodes: ReturnType<typeof getFn>) => any

const { activate, deactivate } = defineExtension(() => {
  logger.show()

  const editor = useActiveTextEditor()
  const doc = computed(() => editor.value?.document)
  const text = useDocumentText(doc)
  const editorSelection = useTextEditorSelection(editor)

  function handler(operater: FnOperator) {
    logger.info('trigger')

    if (
      !editor.value
      || !doc.value
      || !text.value
      || !editorSelection.value
    ) {
      return
    }

    if (!['typescript', 'javascript'].includes(doc.value.languageId))
      return

    if (!text)
      return

    try {
      if (
        editorSelection.value
        && doc.value
      ) {
        const nodes = getFn({
          ast: parse(text.value, {
            plugins: [
              'typescript',
            ],
          }),
          cursorSelection: editorSelection.value,
          doc: doc.value,
        })

        operater(nodes)
      }
      else {
        logger.error('no selection')
      }
    }
    catch (error) {
      logger.error('error', error)
    }
  }

  useCommand(commands.fastCodeSelectorFnSelect, () => {
    handler(({ expression }) => expression && selectNode(expression))
  })

  useCommand(commands.fastCodeSelectorFnDelete, () => {
    handler(({ expression }) => expression && deleteNode(expression))
  })

  useCommand(commands.fastCodeSelectorFnBodySelect, () => {
    handler(({ body }) => body && selectNode(body))
  })

  useCommand(commands.fastCodeSelectorFnBodyDelete, () => {
    handler(({ body }) => body && deleteNode(body))
  })

  useCommand(commands.fastCodeSelectorFnReturnSelect, () => {
    handler(({ returnStatement }) => returnStatement && selectNode(returnStatement))
  })

  useCommand(commands.fastCodeSelectorFnReturnDelete, () => {
    handler(({ returnStatement }) => returnStatement && deleteNode(returnStatement))
  })
})

function getFn(ctx: {
  ast: Node
  doc: TextDocument
  cursorSelection: Selection
}) {
  const supportedNodeType = [
    'FunctionDeclaration',
    'ArrowFunctionExpression',
    'ClassMethod',
  ]

  const { ast, doc, cursorSelection } = ctx

  // let thePath: NodePath<FunctionDeclaration | ArrowFunctionExpression | ClassMethod> | undefined

  let expression: Node | undefined
  let expressionBody: BlockStatement | undefined
  let returnStatement: ReturnStatement | undefined

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
        doc.positionAt(start!),
        doc.positionAt(end!),
      )

      const cursorStartPos = new Position(
        cursorSelection.start.line,
        cursorSelection.start.character,
      )

      const cursorEndPos = new Position(
        cursorSelection.end.line,
        cursorSelection.end.character,
      )

      if (
        fnSelection.start.isBeforeOrEqual(cursorStartPos)
        && fnSelection.end.isAfterOrEqual(cursorEndPos)
      ) {
        // thePath = path
        expression = path.node
        // @ts-expect-error type err
        expressionBody = path.node.body
        // @ts-expect-error type err
        returnStatement = path.node.body.body.find(i => i.type === 'ReturnStatement')
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

function selectNode(node: Node) {
  const editor = useActiveTextEditor()
  if (!editor.value)
    return

  const { loc } = node
  if (!loc)
    return

  if (!editor)
    return

  const start = new Position(loc.start.line - 1, loc.start.column)
  const end = new Position(loc.end.line - 1, loc.end.column)
  editor.value.selection = new Selection(start, end)
}

function deleteNode(node: Node) {
  const editor = useActiveTextEditor()
  if (!editor.value)
    return

  const { loc } = node
  if (!loc)
    return

  const start = new Position(loc.start.line - 1, loc.start.column)
  const end = new Position(loc.end.line - 1, loc.end.column)
  const range = new Range(start, end)

  editor.value.edit((editBuilder) => {
    editBuilder.delete(range)
  }).then((success) => {
    if (success)
      logger.info('Node deleted successfully')
    else
      logger.error('Failed to delete node')
  })
}

export { activate, deactivate }
