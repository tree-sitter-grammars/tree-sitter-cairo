/**
 * @file Cairo grammar for tree-sitter
 * @author Amaan Qureshi <amaanq12@gmail.com>
 * @author Blaž Hrastnik <blaz@mxxn.io>
 * @author Scott Piriou
 * @license MIT
 */

// deno-lint-ignore-file ban-ts-comment
/* eslint-disable arrow-parens */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

'use strict';

const PREC = {
  PAREN: -1,
  ASSIGN: 1,
  LOGICAL_AND: 4,
  EQUALITY: 7,
  ADDITIVE: 8,
  MULTIPLICATIVE: 9,
  UNARY: 10,
  POWER: 11,
  CALL: 12,
  MEMBER: 13,
};

// Based on https://github.com/starkware-libs/cairo-lang/blob/master/src/starkware/cairo/lang/compiler/cairo.ebnf
module.exports = grammar({
  name: 'cairo',

  externals: $ => [
    '%{',
    $.code_line,
    $._failure,
  ],

  extras: $ => [/\s/, $.comment],

  inline: $ => [
    $._instruction_body,
  ],

  supertypes: $ => [
    $.cairo_0_statement,
    $._instruction_body,
  ],

  word: $ => $.identifier,

  rules: {
    program: $ => choice(
      repeat($.cairo_0_statement),
      // repeat($.cairo_1_statement),
    ),

    // ╭──────────────────╮
    // │ Cairo 0.x Parser │
    // ╰──────────────────╯
    cairo_0_statement: $ => choice(
      $.import_statement,
      $.type_definition,
      $.builtin_directive,
      $.lang_directive,
      $.decorated_definition,
      $.namespace_definition,
      $.struct_definition,
      $.function_definition,
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
      'using', $.identifier, '=', $.type, ';',
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
        $.function_definition,
      )),
    ),

    decorator: $ => seq(
      '@',
      $.identifier,
    ),

    namespace_definition: $ => seq(
      'namespace', $.identifier, '{',
      repeat($.cairo_0_statement),
      '}',
    ),

    struct_definition: $ => seq(
      'struct', $.identifier, '{',
      optionalCommaSep($.typed_identifier),
      '}',
    ),

    function_definition: $ => seq(
      'func',
      $.identifier,
      optional($.implicit_arguments),
      $.arguments,
      optional(seq('->', alias(
        choice($.type, $.arguments),
        $.return_type,
      ))),
      '{',
      repeat($.cairo_0_statement),
      '}',
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

    expression_statement: $ => seq($.expression, ';'),

    alloc_locals: _ => seq('alloc_locals', ';'),

    assert_statement: $ => seq(
      'assert', $.expression, '=', $.expression, ';',
    ),

    static_assert_statement: $ => seq(
      'static_assert', $.expression, '==', $.expression, ';',
    ),

    let_binding: $ => seq(
      'let',
      field('left', $._ref_binding),
      '=',
      field('right', choice(
        $.call_instruction,
        $.expression,
      )),
      ';',
    ),

    const_var_declaration: $ => seq(
      'const', $.identifier, '=', $.expression, ';',
    ),

    local_var_declaration: $ => seq(
      'local', $.typed_identifier, optional(seq('=', $.expression)), ';',
    ),

    temp_var_declaration: $ => seq(
      'tempvar', $.typed_identifier, optional(seq('=', $.expression)), ';',
    ),

    instruction: $ => choice(
      seq($._instruction_body, ';'),
      seq(
        $._instruction_body, ',', 'ap', '++', ';',
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
      $.expression, '=', $.expression,
    ),

    inst_jmp_rel: $ => seq(
      'jmp', 'rel', $.expression,
    ),

    inst_jmp_abs: $ => seq(
      'jmp', 'abs', $.expression,
    ),

    inst_jmp_to_label: $ => seq(
      'jmp', $.identifier,
    ),

    inst_jnz: $ => prec(1, seq(
      'jmp', 'rel', $.expression, 'if', $.expression, '!=', $.number,
    )),

    inst_jnz_to_label: $ => prec(1, seq(
      'jmp', $.identifier, 'if', $.expression, '!=', $.number,
    )),

    inst_ret: _ => 'ret',

    inst_add_ap: $ => seq(
      'ap', '+=', $.expression,
    ),

    inst_data_word: $ => seq(
      'dw', $.expression,
    ),

    label: $ => seq($.identifier, ':', $.cairo_0_statement),

    attribute_statement: $ => seq(
      'with_attr',
      $.identifier,
      optional(seq('(', repeat($.string), ')')),
      '{',
      repeat($.cairo_0_statement),
      '}',
    ),

    if_statement: $ => seq(
      'if',
      '(',
      $.expression,
      ')',
      '{',
      repeat($.cairo_0_statement),
      optional(seq('}', 'else', '{', repeat($.cairo_0_statement))),
      '}',
    ),

    with_statement: $ => seq(
      'with', commaSep1($.identifier), '{',
      repeat($.cairo_0_statement),
      '}',
    ),

    return_statement: $ => seq(
      'return', $.expression, ';',
    ),

    non_identifier_type: $ => choice(
      'felt',
      'codeoffset',
      seq($.type, '*'),
      seq($.type, '**'),
      seq('(', commaSep1($.named_type), ')'),
      $.hint,
    ),

    type: $ => choice(
      $.non_identifier_type,
      $.named_type,
    ),

    named_type: $ => prec(1, choice(
      seq(
        $.identifier,
        optional(seq(':', $.type)),
      ),
      $.non_identifier_type,
    )),

    expression: $ => choice(
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
      $.call_expression,
      $.deref_expression,
      $.cast_expression,
    ),

    unary_expression: $ => prec.left(PREC.UNARY,
      seq(
        field('operator', choice('&', '-', 'new')),
        field('operand', $.expression),
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
        field('left', $.expression),
        // @ts-ignore
        field('operator', operator),
        field('right', $.expression),
      ))));
    },

    assignment_expression: $ => prec.right(PREC.ASSIGN, seq(
      field('left', $.expression),
      field('operator', '='),
      field('right', $.expression),
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
      $.expression,
      ']',
    ),

    subscript_expression: $ => prec(PREC.MEMBER, seq(
      $.expression, '[', $.expression, ']',
    )),

    member_expression: $ => prec(PREC.MEMBER, seq(
      $.expression, '.', $.identifier,
    )),

    cast_expression: $ => seq(
      'cast', '(', $.expression, ',', $.type, ')',
    ),

    tuple_expression: $ => prec(PREC.CALL, seq(
      '(',
      optionalCommaSep($.expression),
      ')',
    )),

    call_expression: $ => prec(PREC.CALL, seq(
      $.expression,
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
      seq('call', 'rel', $.expression),
      seq('call', 'abs', $.expression),
      seq('call', $.identifier),
    ),

    typed_identifier: $ => seq(
      optional('local'),
      $.identifier,
      optional(seq(':', $.type)),
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

    comment: _ => token(seq('//', /.*/)),
  },
});

module.exports.PREC = PREC;

/**
 * Creates a rule to optionally match one or more of the rules separated
 * by a comma, optionally ending with a comma
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 *
 */
function optionalCommaSep(rule) {
  return optional(seq(sep1(rule, ','), optional(',')));
}


/**
 * Creates a rule to optionally match one or more of the rules separated
 * by a comma
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 *
 */
function commaSep(rule) {
  return optional(sep1(rule, ','));
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function commaSep1(rule) {
  return sep1(rule, ',');
}

/**
* Creates a rule to match one or more of the rules separated by the separator
*
* @param {Rule} rule
* @param {string|Rule} separator - The separator to use.
*
* @return {SeqRule}
*
*/
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
