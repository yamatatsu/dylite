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
  / PathExpression

Function
  = !ReservedWord head:IdentifierStart tail:IdentifierPart* _ '(' _ args:FunctionArgumentList _ ')' {
      const name = head + tail.join('')
      return {type: 'function', name: name, args: args}
    }

FunctionArgumentList
  = OperandParens|.., _ "," _|

PathExpression
  = head:PathSegment tail:(
      _ '[' _ ix:[0-9]+ _ ']' {
        const index = +(ix.join(''));
        return { type: 'ArrayIndex', index };
      }
    / _ '.' _ prop:PathSegment {
        return prop;
      }
    )* {
      const segments = [head].concat(tail);
      return { type: 'PathExpression', segments };
    }

PathSegment
  = Identifier
  / Alias

Identifier
  = !ReservedWord head:IdentifierStart tail:IdentifierPart* {
      const name = head + tail.join('');
      return { type: 'Identifier', name };
    }

Alias
  = !ReservedWord head:'#' tail:IdentifierPart* {
      const name = head + tail.join('');
      return { type: 'Alias', name };
    }

ExpressionAttributeValue
  = !ReservedWord head:':' tail:IdentifierPart* {
      const name = head + tail.join('');
      return { type: 'AttributeValue', name };
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