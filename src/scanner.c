#include <tree_sitter/parser.h>
// #include <wctype.h>

enum Sym
{
  HINT_CONTENT,
};

#define PEEK lexer->lookahead
// Move the parser position one character to the right and consume a character.
// Or if S_MARK_END was called then it allows to do lookahead more then one character
// but without comsumption and including them into a resulting symbol.
#define S_ADVANCE lexer->advance(lexer, false)
// Move the parser position one character to the right, treating the consumed character as skipped.
// Skipping allow to ignore whitespaces before a token beginning or if some characters
// were marked as consumed by above operation then skip them all.
#define S_SKIP lexer->advance(lexer, true)
#define S_MARK_END lexer->mark_end(lexer)
#define S_RESULT(s) lexer->result_symbol = s;
#define S_EOF lexer->eof(lexer)
#define SYM(s) (symbols[s])

bool scan(void *payload, TSLexer *lexer,
          const bool *symbols)
{
  // In Cairo, hints start with %{ and end with %} and can contain anything
  // including %s in between
  if (SYM(HINT_CONTENT))
  {
    do
    {
      switch (PEEK)
      {
      case '%':
        S_MARK_END;
        S_ADVANCE;
        if (PEEK == '}')
        {
          S_RESULT(HINT_CONTENT);
          return true;
        }

      default:
        S_ADVANCE;
      }
    } while (!S_EOF);
  }

  return false;
}

void *tree_sitter_cairo_external_scanner_create() { return NULL; }

bool tree_sitter_cairo_external_scanner_scan(void *payload, TSLexer *lexer,
                                             const bool *valid_symbols)
{
  return scan(payload, lexer, valid_symbols);
}

unsigned tree_sitter_cairo_external_scanner_serialize(void *payload,
                                                      char *buffer)
{
  return 0;
}
void tree_sitter_cairo_external_scanner_deserialize(void *payload,
                                                    const char *buffer,
                                                    unsigned length) {}

void tree_sitter_cairo_external_scanner_destroy(void *payload) {}
void tree_sitter_cairo_external_scanner_reset(void *payload) {}
