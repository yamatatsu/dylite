{
  // Declared by PEG: input, options, parser, text(), location(), expected(), error()

  const context = options.context
  const attrNames = context.attrNames || {}
  const unusedAttrNames = context.unusedAttrNames || {}
  const isReserved = context.isReserved
  const errors = {}
  const paths = []
  const nestedPaths = Object.create(null)

  function checkReserved(name) {
    if (isReserved(name) && !errors.reserved) {
      errors.reserved = 'Attribute name is a reserved keyword; reserved keyword: ' + name
    }
  }

  function resolveAttrName(name) {
    if (errors.attrNameVal) {
      return
    }
    if (!attrNames[name]) {
      errors.attrNameVal = 'An expression attribute name used in the document path is not defined; attribute name: ' + name
      return
    }
    delete unusedAttrNames[name]
    return attrNames[name]
  }

  function checkPath(path) {
    if (errors.pathOverlap) {
      return
    }
    for (let i = 0; i < paths.length; i++) {
      checkPaths(paths[i], path)
      if (errors.pathOverlap) {
        return
      }
    }
    paths.push(path)
  }

  function checkPaths(path1, path2) {
    for (let i = 0; i < path1.length && i < path2.length; i++) {
      if (typeof path1[i] !== typeof path2[i]) {
        errors.pathConflict = 'Two document paths conflict with each other; ' +
          'must remove or rewrite one of these paths; path one: ' + pathStr(path1) + ', path two: ' + pathStr(path2)
        return
      }
      if (path1[i] !== path2[i]) return
    }
    if (errors.pathOverlap) {
      return
    }
    errors.pathOverlap = 'Two document paths overlap with each other; ' +
      'must remove or rewrite one of these paths; path one: ' + pathStr(path1) + ', path two: ' + pathStr(path2)
  }

  function pathStr(path) {
    return '[' + path.map(function(piece) {
      return typeof piece == 'number' ? '[' + piece + ']' : piece
    }).join(', ') + ']'
  }

  function checkErrors() {
    const errorOrder = ['reserved', 'attrNameVal', 'pathOverlap', 'pathConflict']
    for (let i = 0; i < errorOrder.length; i++) {
      if (errors[errorOrder[i]]) return errors[errorOrder[i]]
    }
    return null
  }
}

Start
  = _ paths:PathList _ {
      paths.forEach(checkPath)
      return checkErrors() || {paths: paths, nestedPaths: nestedPaths}
    }

PathList
  = head:PathExpression tail:(_ ',' _ expr:PathExpression { return expr })* {
      return [head].concat(tail)
    }

PathExpression
  = head:Identifier tail:(
      _ '[' _ ix:[0-9]+ _ ']' {
        return +(ix.join(''))
      }
    / _ '.' _ prop:Identifier {
        return prop
      }
    )* {
      const path = [head].concat(tail)
      if (path.length > 1) {
        nestedPaths[path[0]] = true
      }
      return path
    }

Identifier
  = head:IdentifierStart tail:IdentifierPart* {
      const name = head + tail.join('')
      checkReserved(name)
      return name
    }
  / ExpressionAttributeName

ExpressionAttributeName
  = head:'#' tail:IdentifierPart* {
      return resolveAttrName(head + tail.join(''))
    }

IdentifierStart
  = [a-zA-Z]
  / '_'

IdentifierPart
  = IdentifierStart
  / [0-9]

_ 'whitespace'
  = [ \t\r\n]*
