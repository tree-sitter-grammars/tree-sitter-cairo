#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <tree_sitter/parser.h>
#include <wctype.h>

enum Sym {
  HINT_START,
  PYTHON_CODE_LINE,
  FAILURE,
};

enum Context {
  C_NONE,
  C_PYTHON_CODE,
  C_PYTHON_STRING,
};

enum PythonStringType {
  PST_NONE,
  PST_1_SQ_STRING,
  PST_3_SQ_STRING,
  PST_1_DQ_STRING,
  PST_3_DQ_STRING,
};

#ifdef TREE_SITTER_INTERNAL_BUILD
#define DEBUG
#define LOG(...)                                                               \
  (((State *)state)->debug) ? fprintf(stderr, __VA_ARGS__),                    \
      fputs("\n", stderr)   : 0
#else
#define LOG(...)
#endif

typedef struct {
  uint32_t ws_count;
  uint8_t context;
  uint8_t pst;
#ifdef DEBUG
  bool debug;
#endif
} State;

#define PEEK lexer->lookahead
// Move the parser position one character to the right and consume a character.
// Or if S_MARK_END was called then it allows to do lookahead more then one
// character but without comsumption and including them into a resulting symbol.
#define S_ADVANCE lexer->advance(lexer, false)
// Move the parser position one character to the right, treating the consumed
// character as skipped. Skipping allow to ignore whitespaces before a token
// beginning or if some characters were marked as consumed by above operation
// then skip them all.
#define S_SKIP lexer->advance(lexer, true)
#define S_RESULT(s) lexer->result_symbol = s
#define S_EOF lexer->eof(lexer)

#ifdef DEBUG
#define SYM(s) LOG("symbol: " #s), (symbols[s])
#define S_MARK_END LOG("  mark_end"), lexer->mark_end(lexer)
#define IN_CONTEXT(c) LOG("in_context: " #c), state->context == c
#define SET_CONTEXT(c) LOG("set_context: " #c), state->context = c
#else
#define SYM(s) (symbols[s])
#define S_MARK_END lexer->mark_end(lexer)
#define IN_CONTEXT(c) state->context == c
#define SET_CONTEXT(c) state->context = c
#endif

#define SET_PST(p) state->pst = p
#define IS_PST(p) state->pst == p

bool scan(State *state, TSLexer *lexer, const bool *symbols) {
  if (SYM(FAILURE)) {
    LOG("context: %d, pst: %d, ws indent: %d");
    return false;
  }

  // In Cairo, hints start with %{ and end with %} and can contain anything
  // including %s in between and start / end tokens inside of Python strings

  if (SYM(HINT_START)) {
    if (PEEK == '%') {
      S_SKIP;
      if (PEEK == '{') {
        SET_CONTEXT(C_PYTHON_CODE);
        // Fallback to a built-in lexer
        return false;
      }
    }
  }

  if (SYM(PYTHON_CODE_LINE)) {
    // Skip the first \n after `%{` token,
    // all trailing \n after code lines will be included to themselves
    if (PEEK == '\n') {
      S_SKIP;
    }

    // There is a standalone hint close on line, don't consume it,
    // it's a job of a built-in lexer
    if (PEEK == '%') {
      S_MARK_END;
      S_ADVANCE;
      if (PEEK == '}') {
        if (IN_CONTEXT(C_PYTHON_STRING)) {
          S_RESULT(FAILURE);
          return true;
        }

        SET_CONTEXT(C_NONE);
        return false;
      }
    }

    // Skip whitespaces before the hint content
    // and count them to be able to restore the position
    // after every line
    uint32_t ws_count = 0;
    do {
      if (PEEK == '\n') {
        S_ADVANCE;
        S_RESULT(PYTHON_CODE_LINE);
        return true;
      } else if (iswspace(PEEK)) {
        ws_count++;
        S_SKIP;
        if (state->ws_count > 0 && ws_count == state->ws_count)
          break;
      } else {
        // Make parsing redundant to improperly formated python code.
        if (state->ws_count == 0 || ws_count < state->ws_count)
          state->ws_count = ws_count;
        break;
      }
    } while (!S_EOF);

    LOG("ws indent: %d", state->ws_count);

    uint32_t content_len = 0;
    do {
      switch (PEEK) {
      case '\'':
      case '"':
        const char ch = PEEK;
        S_ADVANCE;
        content_len++;
        if (IN_CONTEXT(C_PYTHON_STRING)) {
          unsigned iter =
              IS_PST(PST_1_DQ_STRING) || IS_PST(PST_1_SQ_STRING) ? 0 : 2;
          if (iter > 0)
            do {
              if (PEEK != ch) {
                SET_CONTEXT(C_PYTHON_CODE);
                SET_PST(PST_NONE);
                return false;
              }
              S_ADVANCE;
              content_len++;
            } while (--iter);
          SET_CONTEXT(C_PYTHON_CODE);
          SET_PST(PST_NONE);
          continue;
        } else {
          if (PEEK == ch) {
            S_ADVANCE;
            content_len++;
            if (PEEK == ch) {
              S_ADVANCE;
              content_len++;
              SET_CONTEXT(C_PYTHON_STRING);
              SET_PST(ch == '"' ? PST_3_DQ_STRING : PST_3_SQ_STRING);
            } else
              return false;
          } else {
            SET_CONTEXT(C_PYTHON_STRING);
            SET_PST(ch == '"' ? PST_1_DQ_STRING : PST_1_SQ_STRING);
          }
        }
        continue;

      case '%':
        if (IN_CONTEXT(C_PYTHON_STRING)) {
          S_ADVANCE;
          content_len++;
          continue;
        }

        S_MARK_END;
        S_ADVANCE;
        if (PEEK == '}') {
          if (IN_CONTEXT(C_PYTHON_STRING)) {
            S_RESULT(FAILURE);
            return true;
          }

          SET_CONTEXT(C_NONE);
          // Don't produce an empty node before a hint close token
          if (content_len > 0) {
            S_RESULT(PYTHON_CODE_LINE);
            return true;
          }
          return false;
        }

      case '\n':
        S_ADVANCE;
        S_MARK_END;
        S_RESULT(PYTHON_CODE_LINE);
        return true;

      default:
        S_ADVANCE;
        content_len++;
      }
    } while (!S_EOF);
  }

  return false;
}

void *tree_sitter_cairo_external_scanner_create() {
  State *state = malloc(sizeof(State));
  state->context = C_NONE;
  state->pst = PST_NONE;
  state->ws_count = 0;
#ifdef DEBUG
  char *debug = getenv("TREE_SITTER_DEBUG");
  state->debug = debug ? strlen(debug) > 0 : false;
#endif
  LOG("create");
  return state;
}

bool tree_sitter_cairo_external_scanner_scan(void *state, TSLexer *lexer,
                                             const bool *valid_symbols) {
  LOG("scan");
  return scan((State *)state, lexer, valid_symbols);
}

unsigned tree_sitter_cairo_external_scanner_serialize(void *state,
                                                      char *buffer) {
  LOG("serialize");
  unsigned len = sizeof(State);
  memcpy(buffer, state, len);
  return len;
}

void tree_sitter_cairo_external_scanner_deserialize(void *state,
                                                    const char *buffer,
                                                    unsigned length) {
  LOG("deserialize");
  if (length > 0) {
    assert(sizeof(State) == length);
    memcpy(state, buffer, sizeof(State));
  }
}

void tree_sitter_cairo_external_scanner_destroy(void *state) {
  LOG("destroy");
  free(state);
}
