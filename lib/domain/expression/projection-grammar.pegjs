{{
  const { PathExpression } = require('./PathExpression');
  const { IdentifierPathSegment, ArrayIndexPathSegment, AliasPathSegment } = require('./PathSegment');
}}

Start
  = _ paths:PathExpression|.., _ "," _| _ {
      return { type: 'ProjectionExpression', paths };
    }

PathExpression
  = head:PathSegment tail:(
      _ '[' _ ix:[0-9]+ _ ']' {
        const index = +(ix.join(''));
        return new ArrayIndexPathSegment(index, options.context);
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
      return new IdentifierPathSegment(name, options.context);
    }

Alias
  = head:'#' tail:IdentifierPart* {
      const name = head + tail.join('');
      return new AliasPathSegment(name, options.context);
    }

IdentifierStart
  = [a-zA-Z]
  / '_'

IdentifierPart
  = IdentifierStart
  / [0-9]

_ 'whitespace'
  = [ \t\r\n]*
