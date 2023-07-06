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

const {PREC} = require('./utils');
const cairo_0_grammar = require('./cairo_0');
const cairo_1_grammar = require('./cairo_1');

// Based on https://github.com/starkware-libs/cairo-lang/blob/master/src/starkware/cairo/lang/compiler/cairo.ebnf
module.exports = grammar({
  name: 'cairo',

  conflicts: $ => [
    [$.typed_identifier, $._pattern],
    [$._cairo_1_expression, $._cairo_1_struct_expression],
    [$.tuple_pattern, $._ref_binding],
    [$._cairo_0_struct_definition, $.field_declaration_list],
    [$._cairo_0_tuple_type, $.unit_type],
  ],

  externals: $ => [
    '%{',
    $.code_line,
    $._failure,
  ],

  extras: $ => [
    $.comment,
    /\s/,
  ],

  inline: $ => [
    $._path,
    $._cairo_1_type_identifier,
    $._cairo_1_field_identifier,
    $._cairo_1_expression_ending_with_block,
    $._instruction_body,
    $._keyword_identifier,
  ],

  supertypes: $ => [
    $._instruction_body,
    $._cairo_0_statement,
    $._cairo_1_expression,
    $._pattern,
  ],

  word: $ => $.identifier,

  rules: {
    program: $ => optional(choice(
      $.cairo_0_file,
      $.cairo_1_file,
    )),

    cairo_0_file: $ => repeat1($._cairo_0_statement),
    cairo_1_file: $ => repeat1($._cairo_1_statement),

    ...Object.fromEntries(
      Object.entries(cairo_0_grammar).filter(([key]) => key !== 'PREC'),
    ),

    ...Object.fromEntries(
      Object.entries(cairo_1_grammar).filter(([key]) => key !== 'PREC'),
    ),
  },
});

module.exports.PREC = PREC;
