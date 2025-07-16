{{
  const { PathExpression } = require('./ast/PathExpression');
  const { IdentifierPathSegment, ArrayIndexPathSegment, AliasPathSegment } = require('./ast/PathSegment');
}}

Start
  = _ paths:PathExpression|.., _ "," _| _ {
      return { type: 'ProjectionExpression', paths };
    }

PathExpression
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
  = head:IdentifierStart tail:IdentifierPart* {
      const name = head + tail.join('');
      return new IdentifierPathSegment(name);
    }

Alias
  = head:'#' tail:IdentifierPart* {
      const name = head + tail.join('');
      return new AliasPathSegment(name, options.context.attrNameMap);
    }

IdentifierStart
  = [a-zA-Z]
  / '_'

IdentifierPart
  = IdentifierStart
  / [0-9]

_ 'whitespace'
  = [ \t\r\n]*
