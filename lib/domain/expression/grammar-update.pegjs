{{
  const { PathExpression } = require('./ast/PathExpression');
  const { IdentifierPathSegment, ArrayIndexPathSegment, AliasPathSegment } = require('./ast/PathSegment');
  const { AttributeValue } = require('./ast/AttributeValue');
}}

Start
  = _ sections:Section|1.., _| _ {
      return { type: 'UpdateExpression', sections };
    }

Section
  = SetSection
  / RemoveSection
  / AddSection
  / DeleteSection

SetSection
  = SetToken _ args:SetExpression|.., _ "," _| {
      return { type: 'SET', expressions: args };
    }

RemoveSection
  = RemoveToken _ args:RemoveExpression|.., _ "," _| {
      return { type: 'REMOVE', expressions: args };
    }

AddSection
  = AddToken _ args:AddExpression|.., _ "," _| {
      return { type: 'ADD', expressions: args };
    }

DeleteSection
  = DeleteToken _ args:DeleteExpression|.., _ "," _| {
      return { type: 'DELETE', expressions: args };
    }

SetExpression
  = path:PathExpressionNode _ '=' _ val:SetValueParens {
      return { type: 'SetExpression', path: path, value: val };
    }

RemoveExpression
  = path:PathExpressionNode {
      return { type: 'RemoveExpression', path: path };
    }

AddExpression
  = path:PathExpressionNode _ val:AttributeValue {
      return { type: 'AddExpression', path: path, value: val };
    }

DeleteExpression
  = path:PathExpressionNode _ val:AttributeValue {
      return { type: 'DeleteExpression', path: path, value: val };
    }

SetValueParens
  = '(' _ val:SetValue _ ')' { return val }
  / SetValue

SetValue
  = arg1:OperandParens _ '+' _ arg2:OperandParens {
      return { type: 'ArithmeticExpression', operator: '+', left: arg1, right: arg2 };
    }
  / arg1:OperandParens _ '-' _ arg2:OperandParens {
      return { type: 'ArithmeticExpression', operator: '-', left: arg1, right: arg2 };
    }
  / OperandParens

OperandParens
  = '(' _ op:Operand _ ')' { return op }
  / Operand

Operand
  = Function
  / AttributeValue
  / PathExpressionNode

Function
  = !ReservedWord head:IdentifierStart tail:IdentifierPart* _ '(' _ args:OperandParens|.., _ "," _| _ ')' {
      const name = head + tail.join('');
      return { type: 'FunctionCall', name: name, args: args };
    }

PathExpressionNode
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
      return new PathExpression(segments);
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

AttributeValue
  = !ReservedWord head:':' tail:IdentifierPart* {
      const name = head + tail.join('');
      return new AttributeValue(name, options.context.attrValMap);
    }

ReservedWord
  = SetToken
  / RemoveToken
  / AddToken
  / DeleteToken

SetToken = 'SET'i !AttributePart
RemoveToken = 'REMOVE'i !AttributePart
AddToken = 'ADD'i !AttributePart
DeleteToken = 'DELETE'i !AttributePart

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