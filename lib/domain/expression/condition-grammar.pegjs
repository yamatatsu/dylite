// This grammar only generates AST without validation or alias resolution

// XXX: We should really refactor this to just construct the expression tree first,
//      and then traverse to check errors afterwards

Start
  = _ expr:OrConditionExpression _ {
      return expr
    }

OrConditionExpression
  = x:AndConditionExpression _ token:OrToken _ y:OrConditionExpression {
      return {type: 'or', args: [x, y]}
    }
  / expr:AndConditionExpression

AndConditionExpression
  = x:NotConditionExpression _ AndToken _ y:AndConditionExpression {
      return {type: 'and', args: [x, y]}
    }
  / NotConditionExpression

NotConditionExpression
  = token:NotToken _ expr:ParensConditionExpression {
      return {type: 'not', args: [expr]}
    }
  / ParensConditionExpression

ParensConditionExpression
  = '(' _ '(' _ expr:OrConditionExpression _ ')' _ ')' {
      return {type: 'redundantParens', expr: expr}
    }
  / '(' _ '(' _ expr:ConditionExpression _ ')' _ ')' {
      return {type: 'redundantParens', expr: expr}
    }
  / expr:ConditionExpression {
      return expr
    }
  / '(' _ expr:OrConditionExpression _ ')' {
      return expr
    }

ConditionExpression
  = x:OperandParens _ comp:Comparator _ y:OperandParens {
      return {type: comp, args: [x, y]}
    }
  / x:OperandParens _ BetweenToken _ y:OperandParens _ AndToken _ z:OperandParens {
      return {type: 'between', args: [x, y, z]}
    }
  / x:OperandParens _ token:InToken _ '(' _ args:FunctionArgumentList _ ')' {
      return {type: 'in', args: [x].concat(args)}
    }
  / f:Function

Comparator
  = '>=' / '<=' / '<>' / '=' / '<' / '>'

OperandParens
  = '(' _ '(' _ op:Operand _ ')' _ ')' {
      return {type: 'redundantParens', expr: op}
    }
  / '(' _ op:Operand _ ')' {
      return op
    }
  / Operand

Operand
  = Function
  / ExpressionAttributeValue
  / path:PathExpression {
      return {type: 'path', path: path}
    }

Function
  = !ReservedWord head:IdentifierStart tail:IdentifierPart* _ '(' _ args:FunctionArgumentList _ ')' {
      const name = head + tail.join('')
      return {type: 'function', name: name, args: args}
    }

FunctionArgumentList
  = head:OperandParens tail:(_ ',' _ expr:OperandParens { return expr })* {
      return [head].concat(tail)
    }

PathExpression
  = head:GroupedPathExpression tail:(
      _ '[' _ ix:[0-9]+ _ ']' {
        return +(ix.join(''))
      }
    / _ '.' _ prop:Identifier {
        return prop
      }
    )* {
      return (Array.isArray(head) ? head : [head]).concat(tail)
    }

GroupedPathExpression
  = Identifier
  / '(' _ '(' _ path:PathExpression _ ')' _ ')' {
      return {type: 'redundantParens', expr: path}
    }
  / '(' _ path:PathExpression _ ')' {
      return path
    }

Identifier
  = !ReservedWord head:IdentifierStart tail:IdentifierPart* {
      const name = head + tail.join('')
      return name
}
  / ExpressionAttributeName

ExpressionAttributeName
  = !ReservedWord head:'#' tail:IdentifierPart* {
      return {type: 'attrName', name: head + tail.join('')}
    }

ExpressionAttributeValue
  = !ReservedWord head:':' tail:IdentifierPart* {
      return {type: 'attrValue', name: head + tail.join('')}
    }

ReservedWord
  = BetweenToken
  / InToken
  / AndToken
  / OrToken
  / NotToken

BetweenToken = 'BETWEEN'i !AttributePart
InToken = 'IN'i !AttributePart
AndToken = 'AND'i !AttributePart
OrToken = 'OR'i !AttributePart
NotToken = 'NOT'i !AttributePart

AttributePart
  = IdentifierPart
  / '#'
  / ':'

IdentifierStart
  = [a-zA-Z]
  / '_'

IdentifierPart
  = IdentifierStart
  / [0-9]

_ 'whitespace'
  = [ \t\r\n]*