Start
  = _ sections:SectionList _ {
      return { type: 'UpdateExpression', sections };
    }

SectionList
  = head:Section tail:(_ sec:Section { return sec })* {
      return [head].concat(tail);
    }

Section
  = SetSection
  / RemoveSection
  / AddSection
  / DeleteSection

SetSection
  = SetToken _ args:SetArgumentList {
      return { type: 'SET', expressions: args };
    }

RemoveSection
  = RemoveToken _ args:RemoveArgumentList {
      return { type: 'REMOVE', expressions: args };
    }

AddSection
  = AddToken _ args:AddArgumentList {
      return { type: 'ADD', expressions: args };
    }

DeleteSection
  = DeleteToken _ args:DeleteArgumentList {
      return { type: 'DELETE', expressions: args };
    }

SetArgumentList
  = head:SetExpression tail:(_ ',' _ expr:SetExpression { return expr })* {
      return [head].concat(tail);
    }

RemoveArgumentList
  = head:RemoveExpression tail:(_ ',' _ expr:RemoveExpression { return expr })* {
      return [head].concat(tail);
    }

AddArgumentList
  = head:AddExpression tail:(_ ',' _ expr:AddExpression { return expr })* {
      return [head].concat(tail);
    }

DeleteArgumentList
  = head:DeleteExpression tail:(_ ',' _ expr:DeleteExpression { return expr })* {
      return [head].concat(tail);
    }

SetExpression
  = path:PathExpression _ '=' _ val:SetValueParens {
      return { type: 'SetExpression', path: path, value: val };
    }

RemoveExpression
  = path:PathExpression {
      return { type: 'RemoveExpression', path: path };
    }

AddExpression
  = path:PathExpression _ val:Value {
      return { type: 'AddExpression', path: path, value: val };
    }

DeleteExpression
  = path:PathExpression _ val:Value {
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
  / Value
  / PathExpression

Function
  = !ReservedWord head:IdentifierStart tail:IdentifierPart* _ '(' _ args:FunctionArgumentList _ ')' {
      const name = head + tail.join('');
      return { type: 'FunctionCall', name: name, args: args };
    }

FunctionArgumentList
  = head:OperandParens tail:(_ ',' _ expr:OperandParens { return expr })* {
      return [head].concat(tail);
    }

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

Value
  = AttributeValue

AttributeValue
  = !ReservedWord head:':' tail:IdentifierPart* {
      const name = head + tail.join('');
      return { type: 'AttributeValue', name };
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