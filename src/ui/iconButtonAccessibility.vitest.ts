import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const SRC_ROOT = path.resolve(process.cwd(), 'src')

function findTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return findTsxFiles(fullPath)
    }

    if (
      entry.name.endsWith('.tsx') &&
      !entry.name.includes('.test.') &&
      !entry.name.includes('.vitest.')
    ) {
      return [fullPath]
    }

    return []
  })
}

function getAntdButtonNames(sourceFile: ts.SourceFile): Set<string> {
  const names = new Set<string>()

  sourceFile.statements.forEach((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      statement.moduleSpecifier.getText(sourceFile) !== "'antd'" ||
      !statement.importClause?.namedBindings ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      return
    }

    statement.importClause.namedBindings.elements.forEach((element) => {
      if ((element.propertyName ?? element.name).text === 'Button') {
        names.add(element.name.text)
      }
    })
  })

  return names
}

function getAttributeNames(attributes: ts.JsxAttributes): Set<string> {
  return new Set(
    attributes.properties.flatMap((attribute) =>
      ts.isJsxAttribute(attribute) ? [attribute.name.getText()] : [],
    ),
  )
}

function hasVisibleText(node: ts.JsxChild): boolean {
  if (ts.isJsxText(node)) {
    return node.text.trim().length > 0
  }

  if (ts.isJsxExpression(node)) {
    return Boolean(node.expression && !ts.isJsxElement(node.expression))
  }

  if (ts.isJsxElement(node)) {
    return node.children.some(hasVisibleText)
  }

  return false
}

function findUnnamedIconButtons(filePath: string): string[] {
  const sourceText = readFileSync(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const buttonNames = getAntdButtonNames(sourceFile)
  const findings: string[] = []

  function visit(node: ts.Node): void {
    const opening = ts.isJsxElement(node)
      ? node.openingElement
      : ts.isJsxSelfClosingElement(node)
        ? node
        : null

    if (opening && buttonNames.has(opening.tagName.getText(sourceFile))) {
      const attributes = getAttributeNames(opening.attributes)
      const hasAccessibleName =
        attributes.has('aria-label') || attributes.has('aria-labelledby')
      const visibleText = ts.isJsxElement(node)
        ? node.children.some(hasVisibleText)
        : false
      const rendersOnlyAnIcon =
        attributes.has('icon') ||
        (ts.isJsxElement(node) &&
          node.children.some(
            (child) =>
              ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child),
          ))

      if (rendersOnlyAnIcon && !visibleText && !hasAccessibleName) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(
          opening.getStart(sourceFile),
        )
        findings.push(
          `${path.relative(process.cwd(), filePath).replaceAll('\\', '/')}:${line + 1}`,
        )
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return findings
}

describe('Ant Design icon button accessibility', () => {
  it('gives every button without visible text an accessible name', () => {
    const findings = findTsxFiles(SRC_ROOT).flatMap(findUnnamedIconButtons)

    expect(findings, findings.join('\n')).toEqual([])
  })
})
