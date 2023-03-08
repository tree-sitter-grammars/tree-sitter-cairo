#include <tree_sitter/parser.h>
#include <wctype.h>

enum TokenType {
  HINT,
};

void *tree_sitter_cairo_external_scanner_create() { return NULL; }
void tree_sitter_cairo_external_scanner_destroy(void *payload) {}
void tree_sitter_cairo_external_scanner_reset(void *payload) {}
unsigned tree_sitter_cairo_external_scanner_serialize(void *payload,
                                                      char *buffer) {
  return 0;
}
void tree_sitter_cairo_external_scanner_deserialize(void *payload,
                                                    const char *buffer,
                                                    unsigned length) {}

static void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

bool tree_sitter_cairo_external_scanner_scan(void *payload, TSLexer *lexer,
                                             const bool *valid_symbols) {

  while (iswspace(lexer->lookahead))
    lexer->advance(lexer, true);

  // In Cairo, hints start with %{ and end with %} and can contain anything
  // including %s in between
  if (valid_symbols[HINT]) {
    if (lexer->lookahead == '%') {
      advance(lexer);
      if (lexer->lookahead == '{') {
        advance(lexer);
        lexer->result_symbol = HINT;
        while (lexer->lookahead != 0) {
          if (lexer->lookahead == '%') {
            advance(lexer);
            if (lexer->lookahead == '}') {
              advance(lexer);
              return true;
            }
          } else {
            advance(lexer);
          }
        }
      }
    }
  }

  return false;
}
