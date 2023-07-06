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
    alias($._cairo_0_import_statement, $.import_statement),
    $.type_definition,
    $.builtin_directive,
    $.lang_directive,
    alias($._cairo_0_decorated_definition, $.decorated_definition),
    alias($._cairo_0_namespace_definition, $.namespace_definition),
    alias($._cairo_0_struct_definition, $.struct_definition),
    alias($._cairo_0_function_definition, $.function_definition),
    alias($._cairo_0_expression_statement, $.expression_statement),
    $.alloc_locals,
    alias($._cairo_0_assert_statement, $.assert_statement),
    alias($._cairo_0_static_assert_statement, $.static_assert_statement),
    alias($._cairo_0_let_binding, $.let_binding),
    $.const_var_declaration,
    $.local_var_declaration,
    $.temp_var_declaration,
    $.instruction,
    $.hint,
    $.label,
    alias($._cairo_0_attribute_statement, $.attribute_statement),
    alias($._cairo_0_if_statement, $.if_statement),
    alias($._cairo_0_with_statement, $.with_statement),
    alias($._cairo_0_return_statement, $.return_statement),
  ),

  _cairo_0_import_statement: $ => seq(
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

  _cairo_0_decorated_definition: $ => seq(
    repeat1($.decorator),
    field('definition', choice(
      alias($._cairo_0_namespace_definition, $.namespace_definition),
      alias($._cairo_0_struct_definition, $.struct_definition),
      alias($._cairo_0_function_definition, $.function_definition),
    )),
  ),

  decorator: $ => seq(
    '@',
    $.identifier,
  ),

  _cairo_0_namespace_definition: $ => seq(
    'namespace', $.identifier, '{',
    repeat($._cairo_0_statement),
    '}',
  ),

  _cairo_0_struct_definition: $ => seq(
    'struct', $.identifier, '{',
    optionalCommaSep($.typed_identifier),
    '}',
  ),

  _cairo_0_function_definition: $ => seq(
    'func',
    $.identifier,
    optional($.implicit_arguments),
    $.arguments,
    optional(seq(
      '->',
      alias(
        $._cairo_0_type,
        $.return_type,
      ),
    )),
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

  _cairo_0_expression_statement: $ => seq($._cairo_0_expression, $._separator),

  alloc_locals: $ => seq('alloc_locals', $._separator),

  _cairo_0_assert_statement: $ => seq(
    'assert', $._cairo_0_expression, '=', $._cairo_0_expression, $._separator,
  ),

  _cairo_0_static_assert_statement: $ => seq(
    'static_assert', $._cairo_0_expression, '==', $._cairo_0_expression, $._separator,
  ),

  _cairo_0_let_binding: $ => seq(
    'let',
    field('left', $._ref_binding),
    '=',
    field('right', choice(
      $.call_instruction,
      $._cairo_0_expression,
    )),
    $._separator,
  ),

  const_var_declaration: $ => seq(
    'const', $.identifier, '=', $._cairo_0_expression, $._separator,
  ),

  local_var_declaration: $ => seq(
    'local', $.typed_identifier, optional(seq('=', $._cairo_0_expression)), $._separator,
  ),

  temp_var_declaration: $ => seq(
    'tempvar', $.typed_identifier, optional(seq('=', $._cairo_0_expression)), $._separator,
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
    $._cairo_0_expression, '=', $._cairo_0_expression,
  ),

  inst_jmp_rel: $ => seq(
    'jmp', 'rel', $._cairo_0_expression,
  ),

  inst_jmp_abs: $ => seq(
    'jmp', 'abs', $._cairo_0_expression,
  ),

  inst_jmp_to_label: $ => seq(
    'jmp', $.identifier,
  ),

  inst_jnz: $ => prec(1, seq(
    'jmp', 'rel', $._cairo_0_expression, 'if', $._cairo_0_expression, '!=', $.number,
  )),

  inst_jnz_to_label: $ => prec(1, seq(
    'jmp', $.identifier, 'if', $._cairo_0_expression, '!=', $.number,
  )),

  inst_ret: _ => 'ret',

  inst_add_ap: $ => seq(
    'ap', '+=', $._cairo_0_expression,
  ),

  inst_data_word: $ => seq(
    'dw', $._cairo_0_expression,
  ),

  label: $ => seq($.identifier, ':', $._cairo_0_statement),

  _cairo_0_attribute_statement: $ => seq(
    'with_attr',
    $.identifier,
    optional(seq('(', repeat($.string), ')')),
    '{',
    repeat($._cairo_0_statement),
    '}',
  ),

  _cairo_0_if_statement: $ => seq(
    'if',
    '(',
    $._cairo_0_expression,
    ')',
    '{',
    repeat($._cairo_0_statement),
    optional(seq('}', 'else', '{', repeat($._cairo_0_statement))),
    '}',
  ),

  _cairo_0_with_statement: $ => seq(
    'with', commaSep1($.identifier), '{',
    repeat($._cairo_0_statement),
    '}',
  ),

  _cairo_0_return_statement: $ => seq(
    'return', $._cairo_0_expression, $._separator,
  ),

  _non_identifier_type: $ => choice(
    alias($._cairo_0_builtin_type, $.builtin_type),
    alias($._cairo_0_pointer_type, $.pointer_type),
    alias($._cairo_0_tuple_type, $.tuple_type),
    $.hint,
  ),

  _cairo_0_builtin_type: _ => choice('felt', 'codeoffset'),

  _cairo_0_pointer_type: $ => seq(choice($._non_identifier_type, $.identifier), choice('*', '**')),

  _cairo_0_tuple_type: $ => seq('(', commaSep($._cairo_0_type), ')'),

  _cairo_0_type: $ => choice(
    $._non_identifier_type,
    $.named_type,
    $.identifier,
  ),

  named_type: $ => prec.right(1, seq(
    $.identifier,
    optional(seq(':', alias($._cairo_0_type, $.type))),
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
      field('operand', $._cairo_0_expression),
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
      field('left', $._cairo_0_expression),
      // @ts-ignore
      field('operator', operator),
      field('right', $._cairo_0_expression),
    ))));
  },

  assignment_expression: $ => prec.right(PREC.ASSIGN, seq(
    field('left', $._cairo_0_expression),
    field('operator', '='),
    field('right', $._cairo_0_expression),
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
    $._cairo_0_expression,
    ']',
  ),

  subscript_expression: $ => prec(PREC.MEMBER, seq(
    $._cairo_0_expression, '[', $._cairo_0_expression, ']',
  )),

  member_expression: $ => prec(PREC.MEMBER, seq(
    $._cairo_0_expression, '.', $.identifier,
  )),

  cast_expression: $ => seq(
    'cast', '(', $._cairo_0_expression, ',', alias($._cairo_0_type, $.type), ')',
  ),

  tuple_expression: $ => prec(PREC.CALL, seq(
    '(',
    optionalCommaSep($._cairo_0_expression),
    ')',
  )),

  _cairo_0_call_expression: $ => prec(PREC.CALL, seq(
    field('function', $._cairo_0_expression),
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
    seq('call', 'rel', $._cairo_0_expression),
    seq('call', 'abs', $._cairo_0_expression),
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
