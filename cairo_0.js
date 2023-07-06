// deno-lint-ignore-file ban-ts-comment
/* eslint-disable arrow-parens */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const {PREC, optionalCommaSep, commaSep, commaSep1, sep1} = require('./utils');

module.exports = {
  // ╭──────────────────╮
  // │ Cairo 0.x Parser │
  // ╰──────────────────╯
  _cairo_0_statement: $ => choice(
    $.import_statement,
    $.type_definition,
    $.builtin_directive,
    $.lang_directive,
    $.decorated_definition,
    $.namespace_definition,
    $.struct_definition,
    alias($._cairo_0_function_definition, $.function_definition),
    $.expression_statement,
    $.alloc_locals,
    $.assert_statement,
    $.static_assert_statement,
    $.let_binding,
    $.const_var_declaration,
    $.local_var_declaration,
    $.temp_var_declaration,
    $.instruction,
    $.hint,
    $.label,
    $.attribute_statement,
    $.if_statement,
    $.with_statement,
    $.return_statement,
  ),

  import_statement: $ => seq(
    'from',
    field('module_name', $.dotted_name),
    'import',
    choice(
      $._import_list,
      seq('(', $._import_list, ')'),
    ),
  ),

  _import_list: $ => prec.right(seq(
    commaSep1(field('name', choice(
      $.dotted_name,
      $.aliased_import,
    ))),
    optional(','),
  )),

  aliased_import: $ => seq(
    field('name', $.dotted_name),
    'as',
    field('alias', $.identifier),
  ),

  type_definition: $ => seq(
    'using', $.identifier, '=', alias($._cairo_0_type, $.type), $._separator,
  ),

  builtin_directive: $ => prec.right(seq(
    '%builtins', repeat1($.identifier),
  )),

  lang_directive: $ => seq(
    '%lang', $.identifier,
  ),

  decorated_definition: $ => seq(
    repeat1($.decorator),
    field('definition', choice(
      $.namespace_definition,
      $.struct_definition,
      alias($._cairo_0_function_definition, $.function_definition),
    )),
  ),

  decorator: $ => seq(
    '@',
    $.identifier,
  ),

  namespace_definition: $ => seq(
    'namespace', $.identifier, '{',
    repeat($._cairo_0_statement),
    '}',
  ),

  struct_definition: $ => seq(
    'struct', $.identifier, '{',
    optionalCommaSep($.typed_identifier),
    '}',
  ),

  _cairo_0_function_definition: $ => seq(
    'func',
    $.identifier,
    optional($.implicit_arguments),
    $.arguments,
    optional(seq('->', alias(
      choice($._cairo_0_type, $.arguments),
      $.return_type,
    ))),
    choice(
      seq('{', repeat($._cairo_0_statement), '}'),
      seq(':', repeat($._cairo_0_statement), 'end'),
    ),
  ),

  implicit_arguments: $ => seq(
    '{',
    optionalCommaSep($.typed_identifier),
    '}',
  ),

  arguments: $ => seq(
    '(',
    commaSep($.typed_identifier),
    optional(','),
    ')',
  ),

  expression_statement: $ => seq(alias($._cairo_0_expression, $.expression), $._separator),

  alloc_locals: $ => seq('alloc_locals', $._separator),

  assert_statement: $ => seq(
    'assert', alias($._cairo_0_expression, $.expression), '=', alias($._cairo_0_expression, $.expression), $._separator,
  ),

  static_assert_statement: $ => seq(
    'static_assert', alias($._cairo_0_expression, $.expression), '==', alias($._cairo_0_expression, $.expression), $._separator,
  ),

  let_binding: $ => seq(
    'let',
    field('left', $._ref_binding),
    '=',
    field('right', choice(
      $.call_instruction,
      alias($._cairo_0_expression, $.expression),
    )),
    $._separator,
  ),

  const_var_declaration: $ => seq(
    'const', $.identifier, '=', alias($._cairo_0_expression, $.expression), $._separator,
  ),

  local_var_declaration: $ => seq(
    'local', $.typed_identifier, optional(seq('=', alias($._cairo_0_expression, $.expression))), $._separator,
  ),

  temp_var_declaration: $ => seq(
    'tempvar', $.typed_identifier, optional(seq('=', alias($._cairo_0_expression, $.expression))), $._separator,
  ),

  instruction: $ => choice(
    seq($._instruction_body, $._separator),
    seq(
      $._instruction_body, ',', 'ap', '++', $._separator,
    ),
  ),

  _instruction_body: $ => choice(
    $.inst_assert_eq,
    $.inst_jmp_rel,
    $.inst_jmp_abs,
    $.inst_jmp_to_label,
    $.inst_jnz,
    $.inst_jnz_to_label,
    $.call_instruction,
    $.inst_ret,
    $.inst_add_ap,
    $.inst_data_word,
  ),

  inst_assert_eq: $ => seq(
    alias($._cairo_0_expression, $.expression), '=', alias($._cairo_0_expression, $.expression),
  ),

  inst_jmp_rel: $ => seq(
    'jmp', 'rel', alias($._cairo_0_expression, $.expression),
  ),

  inst_jmp_abs: $ => seq(
    'jmp', 'abs', alias($._cairo_0_expression, $.expression),
  ),

  inst_jmp_to_label: $ => seq(
    'jmp', $.identifier,
  ),

  inst_jnz: $ => prec(1, seq(
    'jmp', 'rel', alias($._cairo_0_expression, $.expression), 'if', alias($._cairo_0_expression, $.expression), '!=', $.number,
  )),

  inst_jnz_to_label: $ => prec(1, seq(
    'jmp', $.identifier, 'if', alias($._cairo_0_expression, $.expression), '!=', $.number,
  )),

  inst_ret: _ => 'ret',

  inst_add_ap: $ => seq(
    'ap', '+=', alias($._cairo_0_expression, $.expression),
  ),

  inst_data_word: $ => seq(
    'dw', alias($._cairo_0_expression, $.expression),
  ),

  label: $ => seq($.identifier, ':', $._cairo_0_statement),

  attribute_statement: $ => seq(
    'with_attr',
    $.identifier,
    optional(seq('(', repeat($.string), ')')),
    '{',
    repeat($._cairo_0_statement),
    '}',
  ),

  if_statement: $ => seq(
    'if',
    '(',
    alias($._cairo_0_expression, $.expression),
    ')',
    '{',
    repeat($._cairo_0_statement),
    optional(seq('}', 'else', '{', repeat($._cairo_0_statement))),
    '}',
  ),

  with_statement: $ => seq(
    'with', commaSep1($.identifier), '{',
    repeat($._cairo_0_statement),
    '}',
  ),

  return_statement: $ => seq(
    'return', alias($._cairo_0_expression, $.expression), $._separator,
  ),

  non_identifier_type: $ => choice(
    'felt',
    'codeoffset',
    seq(alias($._cairo_0_type, $.type), '*'),
    seq(alias($._cairo_0_type, $.type), '**'),
    seq('(', commaSep1($.named_type), ')'),
    $.hint,
  ),

  _cairo_0_type: $ => choice(
    $.non_identifier_type,
    $.named_type,
  ),

  named_type: $ => prec.right(1, choice(
    seq(
      $.identifier,
      optional(seq(':', alias($._cairo_0_type, $.type))),
    ),
    $.non_identifier_type,
  )),

  _cairo_0_expression: $ => choice(
    $.unary_expression,
    $.binary_expression,
    $.assignment_expression,
    $.subscript_expression,
    $.member_expression,
    $.cast_expression,
    $.tuple_expression,
    $.identifier,
    $.number,
    $.short_string,
    $.hint_expression,
    $.register,
    alias($._cairo_0_call_expression, $.call_expression),
    $.deref_expression,
    $.cast_expression,
  ),

  unary_expression: $ => prec.left(PREC.UNARY,
    seq(
      field('operator', choice('&', '-', 'new')),
      field('operand', alias($._cairo_0_expression, $.expression)),
    ),
  ),

  binary_expression: $ => {
    const table = [
      [prec.left, '+', PREC.ADDITIVE],
      [prec.left, '-', PREC.ADDITIVE],
      [prec.left, '*', PREC.MULTIPLICATIVE],
      [prec.left, '/', PREC.MULTIPLICATIVE],
      [prec.left, 'and', PREC.LOGICAL_AND],
      [prec.right, '**', PREC.POWER],
      [prec.left, '==', PREC.EQUALITY],
      [prec.left, '!=', PREC.EQUALITY],
    ];

    // @ts-ignore
    return choice(...table.map(([fn, operator, precedence]) => fn(precedence, seq(
      field('left', alias($._cairo_0_expression, $.expression)),
      // @ts-ignore
      field('operator', operator),
      field('right', alias($._cairo_0_expression, $.expression)),
    ))));
  },

  assignment_expression: $ => prec.right(PREC.ASSIGN, seq(
    field('left', alias($._cairo_0_expression, $.expression)),
    field('operator', '='),
    field('right', alias($._cairo_0_expression, $.expression)),
  )),

  string: _ => /"(.*?)"/,

  short_string: _ => /'(.*?)'/,

  hint_expression: $ => seq('nondet', $.hint),

  hint: $ => seq(
    '%{',
    optional($.python_code),
    '%}',
  ),

  python_code: $ => repeat1($.code_line),

  register: _ => choice(
    'ap',
    'fp',
  ),

  deref_expression: $ => seq(
    '[',
    alias($._cairo_0_expression, $.expression),
    ']',
  ),

  subscript_expression: $ => prec(PREC.MEMBER, seq(
    alias($._cairo_0_expression, $.expression), '[', alias($._cairo_0_expression, $.expression), ']',
  )),

  member_expression: $ => prec(PREC.MEMBER, seq(
    alias($._cairo_0_expression, $.expression), '.', $.identifier,
  )),

  cast_expression: $ => seq(
    'cast', '(', alias($._cairo_0_expression, $.expression), ',', alias($._cairo_0_type, $.type), ')',
  ),

  tuple_expression: $ => prec(PREC.CALL, seq(
    '(',
    optionalCommaSep(alias($._cairo_0_expression, $.expression)),
    ')',
  )),

  _cairo_0_call_expression: $ => prec(PREC.CALL, seq(
    alias($._cairo_0_expression, $.expression),
    optional(seq(
      '{',
      commaSep($.assignment_expression),
      optional(','),
      '}',
    )),
    $.tuple_expression,
  )),

  _ref_binding: $ => choice(
    $.typed_identifier,
    seq('(', commaSep($.typed_identifier), ')'),
  ),

  call_instruction: $ => choice(
    seq('call', 'rel', alias($._cairo_0_expression, $.expression)),
    seq('call', 'abs', alias($._cairo_0_expression, $.expression)),
    seq('call', $.identifier),
  ),

  typed_identifier: $ => seq(
    optional('local'),
    $.identifier,
    optional(seq(':', alias($._cairo_0_type, $.type))),
  ),

  dotted_name: $ => sep1($.identifier, '.'),

  identifier: _ => /[a-zA-Z_][a-zA-Z_0-9]*/,

  number: _ => {
    const hex_literal = /0x[a-f|A-F|0-9]+/;

    const decimal_literal = /\d+/;

    return token(choice(
      hex_literal,
      decimal_literal,
    ));
  },

  _separator: _ => choice(';', '\n'),

  comment: _ => token(seq('//', /.*/)),
};
