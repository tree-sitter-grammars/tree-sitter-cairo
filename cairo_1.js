// deno-lint-ignore-file ban-ts-comment
/* eslint-disable arrow-parens */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const {PREC, commaSep, commaSep1, sep1} = require('./utils');

const numeric_types = [
  'u8',
  'i8',
  'u16',
  'i16',
  'u32',
  'i32',
  'u64',
  'i64',
  'u128',
  'i128',
  'u256',
  'i256',
  'isize',
  'usize',
  'f32',
  'f64',
  'felt252',
];

const primitive_types = numeric_types.concat(['bool', 'str', 'char']);

module.exports = {
  _cairo_1_statement: $ => choice(
    $.use_declaration,
    $.extern_type_statement,
    $.extern_function_statement,
    $.let_declaration,
    $.attribute_item,
    $.impl_item,
    $.trait_item,
    $.mod_item,
    $.struct_item,
    $.enum_item,
    $.const_item,
    $.type_item,
    alias($._cairo_1_function_definition, $.function_definition),
    alias($._cairo_1_function_signature, $.function_signature),
  ),

  use_declaration: $ => seq(
    // optional($.visibility_modifier),
    'use',
    field('argument', $._use_clause),
    ';',
  ),

  extern_type_statement: $ => seq(
    'extern',
    'type',
    field('name', $.identifier),
    optional($.type_parameters),
    ';',
  ),

  _use_clause: $ => choice(
    $._path,
    $.use_as_clause,
    $.use_list,
    $.scoped_use_list,
    // $.use_wildcard,
  ),

  scoped_use_list: $ => seq(
    field('path', optional($._path)),
    '::',
    field('list', $.use_list),
  ),

  use_list: $ => seq(
    '{',
    sep1($._use_clause, ','),
    optional(','),
    '}',
  ),

  use_as_clause: $ => seq(
    field('path', $._path),
    'as',
    field('alias', $.identifier),
  ),

  extern_function_statement: $ => seq(
    'extern',
    'fn',
    $.identifier,
    optional($.type_parameters),
    $._function_signature,
    ';',
  ),

  attribute_item: $ => seq('#', '[', $._path, optional($.attribute_arguments), ']'),
  attribute_arguments: $ => seq('(', commaSep(seq(optional(seq($.identifier, ':' )), $._cairo_1_expression)), ')'),

  mod_item: $ => seq(
    // optional($.visibility_modifier),
    'mod',
    field('name', $.identifier),
    choice(
      ';',
      field('body', $.declaration_list),
    ),
  ),

  struct_item: $ => seq(
    // optional($.visibility_modifier),
    'struct',
    field('name', $._cairo_1_type_identifier),
    field('type_parameters', optional($.type_parameters)),
    choice(
      seq(
        // optional($.where_clause),
        field('body', $.field_declaration_list),
      ),
      // seq(
      // field('body', $.ordered_field_declaration_list),
      // optional($.where_clause),
      // ';',
      // ),
      ';',
    ),
  ),

  enum_item: $ => seq(
    // optional($.visibility_modifier),
    'enum',
    field('name', $._cairo_1_type_identifier),
    field('type_parameters', optional($.type_parameters)),
    // optional($.where_clause),
    field('body', $.enum_variant_list),
  ),

  enum_variant_list: $ => seq(
    '{',
    commaSep(seq(repeat($.attribute_item), $.enum_variant)),
    optional(','),
    '}',
  ),

  enum_variant: $ => seq(
    // optional($.visibility_modifier),
    field('name', $.identifier),
    ':',
    field('body', optional(choice(
      // $.field_declaration_list,
      // $.ordered_field_declaration_list,
      $._cairo_1_type,
    ))),
    optional(seq(
      '=',
      field('value', $._cairo_1_expression),
    )),
  ),


  field_declaration_list: $ => seq(
    '{',
    commaSep(seq(repeat($.attribute_item), $.field_declaration)),
    optional(','),
    '}',
  ),

  field_declaration: $ => seq(
    // optional($.visibility_modifier),
    field('name', $._cairo_1_field_identifier),
    ':',
    field('type', $._cairo_1_type),
  ),

  ordered_field_declaration_list: $ => seq(
    '(',
    commaSep(seq(
      repeat($.attribute_item),
      // optional($.visibility_modifier),
      field('type', $._cairo_1_type),
    )),
    optional(','),
    ')',
  ),

  const_item: $ => seq(
    // optional($.visibility_modifier),
    'const',
    field('name', $.identifier),
    ':',
    field('type', $._cairo_1_type),
    optional(
      seq(
        '=',
        field('value', $._cairo_1_expression),
      ),
    ),
    ';',
  ),

  type_item: $ => seq(
    // optional($.visibility_modifier),
    'type',
    field('name', $._cairo_1_type_identifier),
    field('type_parameters', optional($.type_parameters)),
    '=',
    field('type', $._cairo_1_type),
    ';',
  ),


  block: $ => seq(
    '{',
    repeat(choice($._cairo_1_statement, alias($._cairo_1_expression_statement, $.expression_statement))),
    '}',
  ),

  _cairo_1_function_definition: $ => seq(
    'fn',
    $.identifier,
    optional($.type_parameters),
    $._function_signature,
    $.block,
  ),

  _function_signature: $ => seq(
    '(',
    commaSep($.parameter),
    ')',
    optional(seq('->', field('returns', alias($._cairo_1_type, $.type)))),
    optional(seq('implicits', '(', commaSep($.identifier), ')')),
    optional('nopanic'),
  ),

  _cairo_1_function_signature: $ => seq(
    'fn',
    $.identifier,
    optional($.type_parameters),
    '(',
    commaSep($.parameter),
    ')',
    optional(seq('->', field('returns', alias($._cairo_1_type, $.type)))),
    // optional(seq('implicits', '(', commaSep($.identifier), ')')),
    optional('nopanic'),
    ';',
  ),

  parameter: $ => seq(
    optional(choice('ref', 'mut')),
    $.identifier,
    ':',
    alias($._cairo_1_type, $.type),
  ),

  impl_item: $ => seq(
    'impl',
    alias($._cairo_1_type, $.type),
    'of',
    alias($._cairo_1_type, $.type),
    choice(
      $.block,
      ';',
    ),
  ),

  trait_item: $ => seq(
    // optional($.visibility_modifier),
    // optional('unsafe'),
    'trait',
    field('name', $._cairo_1_type_identifier),
    field('type_parameters', optional($.type_parameters)),
    field('bounds', optional($.trait_bounds)),
    // optional($.where_clause),
    choice(field('body', $.declaration_list), ';'),
  ),

  let_declaration: $ => seq(
    'let',
    optional('mut'),
    field('pattern', $._pattern),
    optional(seq(
      ':',
      field('type', $._cairo_1_type),
    )),
    optional(seq(
      '=',
      field('value', $._cairo_1_expression),
    )),
    // optional(seq(
    //   'else',
    //   field('alternative', $.block),
    // )),
    ';',
  ),

  declaration_list: $ => seq(
    '{',
    repeat($._cairo_1_statement),
    '}',
  ),

  _cairo_1_type: $ => choice(
    $.identifier,
    $.scoped_type_identifier,
    $.at_type,
    $.generic_type,
    $.tuple_type,
    $.abstract_type,
    alias(choice(...primitive_types), $.primitive_type),
    $.unit_type,
  ),

  // TODO: what?
  at_type: $ => seq(
    '@',
    alias($._cairo_1_type, $.type),
  ),

  _cairo_1_generic_function: $ => prec(1, seq(
    field('function', choice(
      $.identifier,
      $.scoped_identifier,
      alias($._cairo_1_field_expression, $.field_expression),
    )),
    '::',
    field('type_arguments', $.type_arguments),
  )),

  generic_type: $ => prec(1, seq(
    field('type', choice(
      $._cairo_1_type_identifier,
      $.scoped_type_identifier,
    )),
    optional('::'),
    field('type_arguments', $.type_arguments),
  )),

  generic_type_with_turbofish: $ => seq(
    field('type', choice(
      $._cairo_1_type_identifier,
      $.scoped_identifier,
    )),
    '::',
    field('type_arguments', $.type_arguments),
  ),

  type_arguments: $ => seq(
    token(prec(1, '<')),
    sep1(
      choice(
        alias($._cairo_1_type, $.type),
        // $.type_binding,
        // $.lifetime,
        $._literal,
        $.block,
      ),
      ',',
    ),
    optional(','),
    '>',
  ),

  tuple_type: $ => seq(
    '(',
    commaSep1(alias($._cairo_1_type, $.type)),
    optional(','),
    ')',
  ),

  unit_type: _ => seq('(', ')'),

  abstract_type: $ => seq(
    'impl',
    field('trait', choice(
      $._cairo_1_type_identifier,
      $.scoped_type_identifier,
      $.generic_type,
      // $.function_type,
    )),
    $.trait_bounds,
  ),

  _cairo_1_expression_statement: $ => seq(
    $._cairo_1_expression,
    optional(';'),
  ),

  _cairo_1_expression: $ => (choice(
    $.identifier,
    $._keyword_identifier,
    $.scoped_identifier,
    alias($._cairo_1_short_string, $.short_string),
    $.self,
    $._literal,
    alias(choice(...primitive_types), $.identifier),
    alias($._cairo_1_call_expression, $.call_expression),
    alias($._cairo_1_field_expression, $.field_expression),
    alias($._cairo_1_unit_expression, $.unit_expression),
    alias($._cairo_1_parenthesized_expression, $.parenthesized_expression),
    alias($._cairo_1_tuple_expression, $.tuple_expression),
    alias($._cairo_1_unary_expression, $.unary_expression),
    alias($._cairo_1_binary_expression, $.binary_expression),
    alias($._cairo_1_assignment_expression, $.assignment_expression),
    alias($._cairo_1_compound_assignment_expression, $.compound_assignment_expression),
    alias($._cairo_1_struct_expression, $.struct_expression),
    alias($._cairo_1_try_expression, $.try_expression),
    alias($._cairo_1_return_expression, $.return_expression),
    alias($._cairo_1_loop_expression, $.loop_expression),
    alias($._cairo_1_generic_function, $.generic_function),
    alias($._cairo_1_at_expression, $.at_expression),
    alias($._cairo_1_index_expression, $.index_expression),
    $._cairo_1_expression_ending_with_block,
  )),

  _cairo_1_expression_ending_with_block: $ => choice(
    // $.unsafe_block,
    // $.async_block,
    $.block,
    alias($._cairo_1_if_expression, $.if_expression),
    $.match_expression,
    // $.while_expression,
    // $.loop_expression,
    // $.for_expression,
    // $.const_block,
  ),

  _cairo_1_return_expression: $ => choice(
    prec.left(seq('return', $._cairo_1_expression)),
    prec(-1, 'return'),
  ),

  _cairo_1_if_expression: $ => prec.right(seq(
    'if',
    field('condition', $._cairo_1_expression),
    field('consequence', $.block),
    optional(field('alternative', alias($._cairo_1_else_clause, $.else_clause))),
  )),

  _cairo_1_else_clause: $ => seq('else', choice($.block, alias($._cairo_1_if_expression, $.if_expression))),

  match_expression: $ => seq(
    'match',
    field('value', $._cairo_1_expression),
    field('body', $.match_block),
  ),

  match_block: $ => seq(
    '{',
    optional(seq(
      repeat($.match_arm),
      alias($.last_match_arm, $.match_arm),
    )),
    '}',
  ),

  match_arm: $ => seq(
    repeat($.attribute_item),
    field('pattern', $.match_pattern),
    '=>',
    choice(
      seq(field('value', $._cairo_1_expression), ','),
      field('value', prec(1, $._cairo_1_expression_ending_with_block)),
    ),
  ),

  last_match_arm: $ => seq(
    repeat($.attribute_item),
    field('pattern', $.match_pattern),
    '=>',
    field('value', $._cairo_1_expression),
    optional(','),

  ),

  match_pattern: $ => seq(
    $._pattern,
    optional(seq('if', field('condition', $._cairo_1_expression))),
  ),

  _cairo_1_loop_expression: $ => seq(
    // optional(seq($.loop_label, ':')),
    'loop',
    field('body', $.block),
  ),

  _cairo_1_at_expression: $ => prec.right(seq(
    '@',
    $._cairo_1_expression,
  )),

  _pattern: $ => choice(
    $._literal_pattern,
    alias(choice(...primitive_types), $.identifier),
    $.identifier,
    $.scoped_identifier,
    $.tuple_pattern,
    $.tuple_struct_pattern,
    $.struct_pattern,
    // $._reserved_identifier,
    // $.ref_pattern,
    // $.slice_pattern,
    // $.captured_pattern,
    // $.reference_pattern,
    // $.remaining_field_pattern,
    // $.mut_pattern,
    // $.range_pattern,
    // $.or_pattern,
    // $.const_block,
    // $.macro_invocation,
    '_',
  ),

  tuple_pattern: $ => seq(
    '(',
    commaSep($._pattern),
    optional(','),
    ')',
  ),

  tuple_struct_pattern: $ => seq(
    field('type', choice(
      $.identifier,
      $.scoped_identifier,
    )),
    '(',
    commaSep($._pattern),
    optional(','),
    ')',
  ),

  struct_pattern: $ => seq(
    field('type', choice(
      $._cairo_1_type_identifier,
      $.scoped_type_identifier,
      alias(choice(...primitive_types), $.primitive_type),
    )),
    '{',
    // commaSep(choice($.field_pattern, $.remaining_field_pattern)),
    commaSep($.field_pattern),
    optional(','),
    '}',
  ),

  field_pattern: $ => seq(
    optional('ref'),
    optional('mut'),
    choice(
      field('name', alias($.identifier, $.shorthand_field_identifier)),
      seq(
        field('name', $._cairo_1_field_identifier),
        ':',
        field('pattern', $._pattern),
      ),
    ),
  ),

  remaining_field_pattern: $ => '..',

  _cairo_1_unary_expression: $ => prec(PREC.UNARY, seq(
    choice('-', '*', '!', '~'),
    $._cairo_1_expression,
  )),

  _cairo_1_binary_expression: $ => {
    const table = [
      [PREC.LOGICAL_AND, '&&'],
      [PREC.LOGICAL_OR, '||'],
      [PREC.BITAND, '&'],
      [PREC.BITOR, '|'],
      [PREC.BITXOR, '^'],
      [PREC.EQUALITY, choice('==', '!=', '<', '<=', '>', '>=')],
      [PREC.SHIFT, choice('<<', '>>')],
      [PREC.ADDITIVE, choice('+', '-')],
      [PREC.MULTIPLICATIVE, choice('*', '/', '%')],
    ];

    // @ts-ignore
    return choice(...table.map(([precedence, operator]) => prec.left(precedence, seq(
      field('left', $._cairo_1_expression),
      // @ts-ignore
      field('operator', operator),
      field('right', $._cairo_1_expression),
    ))));
  },

  _cairo_1_assignment_expression: $ => prec.left(PREC.ASSIGN, seq(
    field('left', $._cairo_1_expression),
    '=',
    field('right', $._cairo_1_expression),
  )),

  _cairo_1_compound_assignment_expression: $ => prec.left(PREC.ASSIGN, seq(
    field('left', $._cairo_1_expression),
    field('operator', choice('+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=')),
    field('right', $._cairo_1_expression),
  )),

  _cairo_1_try_expression: $ => seq(
    $._cairo_1_expression,
    '?',
  ),

  _cairo_1_call_expression: $ => prec(PREC.CALL, seq(
    field('function', $._cairo_1_expression),
    '(',
    commaSep(seq(
      optional('ref'),
      optional(seq(
        optional(field('name', $.identifier)),
        ':',
      )),
      $._cairo_1_expression,
    )),
    ')',
  )),

  _cairo_1_index_expression: $ => prec(PREC.CALL, seq(
    $._cairo_1_expression, '[', $._cairo_1_expression, ']',
  )),

  _cairo_1_field_expression: $ => prec(PREC.MEMBER, seq(
    field('value', $._cairo_1_expression),
    '.',
    field('field', $._cairo_1_field_identifier),
  )),

  _cairo_1_parenthesized_expression: $ => seq(
    '(',
    $._cairo_1_expression,
    ')',
  ),

  _cairo_1_tuple_expression: $ => seq(
    '(',
    repeat($.attribute_item),
    seq($._cairo_1_expression, ','),
    repeat(seq($._cairo_1_expression, ',')),
    optional($._cairo_1_expression),
    ')',
  ),

  _cairo_1_unit_expression: _ => seq('(', ')'),

  _cairo_1_struct_expression: $ => seq(
    field('name', choice(
      $._cairo_1_type_identifier,
      alias(choice(...primitive_types), $.primitive_type),
      // alias($.scoped_type_identifier_in_expression_position, $.scoped_type_identifier),
      // $.generic_type_with_turbofish,
    )),
    field('body', $.field_initializer_list),
  ),

  field_initializer_list: $ => seq(
    '{',
    commaSep(choice(
      $.shorthand_field_initializer,
      $.field_initializer,
      $.base_field_initializer,
    )),
    optional(','),
    '}',
  ),

  shorthand_field_initializer: $ => seq(
    repeat($.attribute_item),
    $.identifier,
  ),

  field_initializer: $ => seq(
    repeat($.attribute_item),
    field('name', $._cairo_1_field_identifier),
    ':',
    field('value', $._cairo_1_expression),
  ),

  base_field_initializer: $ => seq(
    '..',
    $._cairo_1_expression,
  ),

  trait_bounds: $ => seq(
    ':',
    // sep1('+', choice(
    //   $._type,
    //   $.lifetime,
    //   $.higher_ranked_trait_bound,
    //   $.removed_trait_bound,
    // )),
    choice(alias($._cairo_1_type, $.type)),
  ),

  type_parameters: $ => prec(1, seq(
    '<',
    sep1(
      choice(
        // $.lifetime,
        // $.metavariable,
        $._cairo_1_type_identifier,
        $.constrained_type_parameter,
        $.abstract_type,
        // $.optional_type_parameter,
        // $.const_parameter,
      ),
      ',',
    ),
    optional(','),
    '>',
  )),

  constrained_type_parameter: $ => seq(
    // field('left', choice($.lifetime, $._type_identifier)),
    optional('const'),
    field('left', $._cairo_1_type_identifier),
    field('bounds', $.trait_bounds),
  ),

  _literal: $ => choice(
    $.number,
  ),

  _literal_pattern: $ => choice(
    $.number,
  ),

  _cairo_1_short_string: _ => token(seq(
    /'(.*?)'/,
    optional(seq('_', choice(...numeric_types))),
  )),

  number: _ => token(seq(
    optional('-'),
    choice(
      /[0-9][0-9_]*/,
      /0x[0-9a-fA-F_]+/,
      /0b[01_]+/,
      /0o[0-7_]+/,
    ),
    optional(choice(...numeric_types)),
  )),

  namespace_name: $ => sep1($.identifier, '::'),

  scoped_identifier: $ => prec(1, seq(
    field('path', optional(choice(
      $._path,
      alias($.generic_type_with_turbofish, $.generic_type),
    ))),
    '::',
    field('name', $.identifier),
  )),

  scoped_type_identifier: $ => seq(
    field('path', optional(choice(
      $._path,
      // alias($.generic_type_with_turbofish, $.generic_type),
      // $.bracketed_type,
      $.generic_type,
    ))),
    '::',
    field('name', $._cairo_1_type_identifier),
  ),


  _path: $ => choice(
    $.self,
    alias(choice(...primitive_types), $.identifier),
    // prec(-1, $._keyword_identifier),
    // alias(choice(...primitive_types), $.identifier),
    // $.metavariable,
    // $.super,
    // $.crate,
    $.identifier,
    $.scoped_identifier,
    // $._reserved_identifier,
  ),

  _cairo_1_type_identifier: $ => alias($.identifier, $.type_identifier),
  _cairo_1_field_identifier: $ => alias($.identifier, $.field_identifier),

  _keyword_identifier: $ => prec(-3, alias(choice(
    ...primitive_types,
  ), $.identifier)),

  self: $ => 'self',
  // super: $ => 'super',
  // crate: $ => 'crate',
};
