Start
  = _ paths:PathList _ {
      return { type: 'ProjectionExpression', paths };
    }

PathList
  = head:PathExpression tail:(_ ',' _ expr:PathExpression { return expr })* {
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
  = head:IdentifierStart tail:IdentifierPart* {
      const name = head + tail.join('');
      return { type: 'Identifier', name };
    }

Alias
  = head:'#' tail:IdentifierPart* {
      const name = head + tail.join('');
      return { type: 'Alias', name };
    }

IdentifierStart
  = [a-zA-Z]
  / '_'

IdentifierPart
  = IdentifierStart
  / [0-9]

_ 'whitespace'
  = [ \t\r\n]*
