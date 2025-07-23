{{
  const { ConditionExpression } = require('./ast/ConditionExpression');
  const { LogicalOperator } = require('./ast/LogicalOperator');
  const { NotOperator } = require('./ast/NotOperator');
  const { ComparisonOperator } = require('./ast/ComparisonOperator');
  const { BetweenOperator } = require('./ast/BetweenOperator');
  const { InOperator } = require('./ast/InOperator');
  const { ConditionFunction } = require('./ast/ConditionFunction');
  const { RedundantParens } = require('./ast/RedundantParens');
  const { DocumentPath } = require('./ast/DocumentPath');
  const { IdentifierPathSegment, ArrayIndexPathSegment, AliasPathSegment } = require('./ast/PathSegment');
  const { AttributeValue } = require('./ast/AttributeValue');
}}

Start
  = _ expr:OrConditionExpression _ {
      return new ConditionExpression(expr)
    }

OrConditionExpression
  = x:AndConditionExpression _ token:OrToken _ y:OrConditionExpression {
      return new LogicalOperator('OR', x, y)
    }
  / expr:AndConditionExpression

AndConditionExpression
  = x:NotConditionExpression _ AndToken _ y:AndConditionExpression {
      return new LogicalOperator('AND', x, y)
    }
  / NotConditionExpression

NotConditionExpression
  = token:NotToken _ expr:ParensConditionExpression {
      return new NotOperator(expr)
    }
  / ParensConditionExpression

ParensConditionExpression
  = '(' _ '(' _ expr:OrConditionExpression _ ')' _ ')' {
      return new RedundantParens(expr)
    }
  / '(' _ '(' _ expr:ConditionExpression _ ')' _ ')' {
      return new RedundantParens(expr)
    }
  / expr:ConditionExpression {
      return expr
    }
  / '(' _ expr:OrConditionExpression _ ')' {
      return expr
    }

ConditionExpression
  = x:OperandParens _ comp:Comparator _ y:OperandParens {
      return new ComparisonOperator(comp, x, y)
    }
  / x:OperandParens _ BetweenToken _ y:OperandParens _ AndToken _ z:OperandParens {
      return new BetweenOperator(x, y, z)
    }
  / x:OperandParens _ token:InToken _ '(' _ args:FunctionArgumentList _ ')' {
      return new InOperator(x, args)
    }
  / f:Function

Comparator
  = '>=' / '<=' / '<>' / '=' / '<' / '>'

OperandParens
  = '(' _ '(' _ op:Operand _ ')' _ ')' {
      return new RedundantParens(op)
    }
  / '(' _ op:Operand _ ')' {
      return op
    }
  / Operand

Operand
  = Function
  / ExpressionAttributeValue
  / DocumentPath

Function
  = !ReservedWord head:IdentifierStart tail:IdentifierPart* _ '(' _ args:FunctionArgumentList _ ')' {
      const name = head + tail.join('')
      return new ConditionFunction(name, args)
    }

FunctionArgumentList
  = OperandParens|.., _ "," _|

DocumentPath
  = head:PathSegment tail:(
      _ '[' _ ix:[0-9]+ _ ']' {
        const index = +(ix.join(''));
        return new ArrayIndexPathSegment(index);
      }
    / _ '.' _ prop:PathSegment {
        return prop;
      }
    )* {
      const segments = [head].concat(tail);
      return new DocumentPath(segments);
    }

PathSegment
  = Identifier
  / Alias

Identifier
  = !ReservedWord head:IdentifierStart tail:IdentifierPart* {
      const name = head + tail.join('');
      return new IdentifierPathSegment(name);
    }

Alias
  = !ReservedWord head:'#' tail:IdentifierPart* {
      const name = head + tail.join('');
      return new AliasPathSegment(name, options.context.attrNameMap);
    }

ExpressionAttributeValue
  = !ReservedWord head:':' tail:IdentifierPart* {
      const name = head + tail.join('');
      return new AttributeValue(name, options.context.attrValMap);
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
