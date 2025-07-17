{{
  const { PathExpression } = require('./ast/PathExpression');
  const { IdentifierPathSegment, ArrayIndexPathSegment, AliasPathSegment } = require('./ast/PathSegment');
  const { AttributeValue } = require('./ast/AttributeValue');
  const { FunctionForUpdate } = require('./ast/FunctionForUpdate');
  const { ArithmeticExpression } = require('./ast/ArithmeticExpression');
  const { SetAction } = require('./ast/SetAction');
  const { RemoveAction } = require('./ast/RemoveAction');
  const { AddAction } = require('./ast/AddAction');
  const { DeleteAction } = require('./ast/DeleteAction');
  const { SetSection } = require('./ast/SetSection');
  const { RemoveSection } = require('./ast/RemoveSection');
  const { AddSection } = require('./ast/AddSection');
  const { DeleteSection } = require('./ast/DeleteSection');
  const { UpdateExpression } = require('./ast/UpdateExpression');
}}

Start
  = _ sections:Section|1.., _| _ {
      return new UpdateExpression(sections);
    }

Section
  = SetSection
  / RemoveSection
  / AddSection
  / DeleteSection

SetSection
  = SetToken _ args:SetAction|.., _ "," _| {
      return new SetSection(args);
    }

RemoveSection
  = RemoveToken _ args:RemoveAction|.., _ "," _| {
      return new RemoveSection(args);
    }

AddSection
  = AddToken _ args:AddAction|.., _ "," _| {
      return new AddSection(args);
    }

DeleteSection
  = DeleteToken _ args:DeleteAction|.., _ "," _| {
      return new DeleteSection(args);
    }

SetAction
  = path:PathExpressionNode _ '=' _ val:SetValueParens {
      return new SetAction(path, val);
    }

RemoveAction
  = path:PathExpressionNode {
      return new RemoveAction(path);
    }

AddAction
  = path:PathExpressionNode _ val:AttributeValue {
      return new AddAction(path, val);
    }

DeleteAction
  = path:PathExpressionNode _ val:AttributeValue {
      return new DeleteAction(path, val);
    }

SetValueParens
  = '(' _ val:SetValue _ ')' { return val }
  / SetValue

SetValue
  = arg1:OperandParens _ '+' _ arg2:OperandParens {
      return new ArithmeticExpression('+', arg1, arg2);
    }
  / arg1:OperandParens _ '-' _ arg2:OperandParens {
      return new ArithmeticExpression('-', arg1, arg2);
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
      return new FunctionForUpdate(name, args);
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