const IDENTIFIER = /[a-zA-Z_][a-zA-Z_0-9]*/;
module.exports = grammar({
  name: 'cairo',
 
  // Based on https://github.com/starkware-libs/cairo-lang/blob/master/src/starkware/cairo/lang/compiler/cairo.ebnf  

  extras: $ => [/\s/, $.comment],

  rules: {
    cairo_file: $ => $.code_block,

    code_block: $ => repeat1($._code_element),

    _code_element: $ => choice(
      'alloc_locals',
      $.code_element_member,
      $.code_element_const,
      $.code_element_reference,
      $.code_element_local_var,
      $.code_element_temp_var,
      $.code_element_compound_assert_eq,
      $.code_element_static_assert,
      $.code_element_return,
      // TODO: split return into normal + function return
      $.code_element_if,
      $.function_call,
      $.code_element_function,
      $.code_element_struct,
      $.code_element_typedef,
      $.code_element_with_attr_statement,
      $.code_element_with_statement,
      $.code_element_hint,
      $.code_element_directive,
      $.code_element_import,
      $.code_element_instruction,
    ),

    implicit_arguments: $ => seq('{', sep(",", $.typed_identifier), '}'),

    arguments: $ => seq('(', sep(",", $.typed_identifier), ')'),
    
    
    named_type: $ => prec(1, choice(
      seq(
        $.identifier,
        optional(seq(":", $.type)),
      ),
      $.non_identifier_type,
    )),

    non_identifier_type: $ => choice(
      'felt',
      'codeoffset',
      seq( $.type, '*'),
      seq( $.type, '**'),
      seq("(", sep1(",", $.named_type), ")")
    ),
    
    type: $ => choice(
      $.non_identifier_type,
      $.named_type,
    ),

    code_element_instruction: $ => choice(
      $._instruction_body,
      seq(
        $._instruction_body, ';', 'ap', '++',
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
      $._expr, '=', $._expr
    ),

    inst_jmp_rel: $ => seq(
      'jmp', 'rel', $._expr,
    ),

    inst_jmp_abs: $ => seq(
      'jmp', 'abs', $._expr,
    ),

    inst_jmp_to_label: $ => seq(
      'jmp', $.identifier,
    ),

    inst_jnz: $ => prec(1, seq(
      'jmp', 'rel', $._expr, 'if', $._expr, '!=', $.number,
    )),

    inst_jnz_to_label: $ => prec(1, seq(
      'jmp', $.identifier, 'if', $._expr, '!=', $.number,
    )),

    inst_ret: $ => 'ret',

    inst_add_ap: $ => seq(
      'ap', '+=', $._expr,
    ),

    inst_data_word: $ => seq(
      'dw', $._expr,
    ),

    code_element_import: $ => seq(
      'from', $.identifier, 'import', $.import_body,
    ),

    import_body: $ => seq(
      choice(
        seq("(", sep1(',', $.aliased_identifier), ")"), // optional set of parentheses
        sep1(',', $.aliased_identifier),
      )
    ),

    aliased_identifier: $ => seq(
      $.identifier_def,
      optional(seq(
        'as',
        $.identifier_def
      ))
    ),

    hint: $ => seq("%{", field("body", repeat(/.+/)), "%}"),

    code_element_hint: $ => $.hint,

    code_element_directive: $ => choice(
      $.builtin_directive,
      $.lang_directive,
    ),

    builtin_directive: $ => prec.right(seq(
      '%builtins', repeat1($.identifier)
    )),

    lang_directive: $ => seq(
      '%lang', $.identifier
    ),
    
    bool_expr: $ => choice(
      seq($._expr, "==", $._expr),
      seq($._expr, "!=", $._expr)
    ),

    code_element_if: $ => seq(
      "if", $.bool_expr, ":", $.code_block,
      optional(seq("else", ":", $.code_block)),
      "end"
    ),

    code_element_return: $ => seq(
      'return', choice($.arg_list, $.function_call)
    ),

    arg_list: $ => seq('(', sep(',', $.arg_list_item), ')'),

    arg_list_item: $ => $._expr_assignment,

    _expr: $ => prec.right(2, $._sum),

    _sum: $ => prec(1, choice(
      $._product,
      $.expr_add,
      $.expr_sub,
    )),

    _product: $ => prec(2, choice(
      $._unary,
      $.expr_mul,
      $.expr_div,
    )),

    _unary: $ => prec(3, choice(
      $._pow,
      $.unary_addressof,
      $.unary_neg,
      $.unary_new_operator,
    )),

    _pow: $ => prec(4, choice(
      $._atom,
      $.expr_pow,
    )),

    _atom: $ => prec(5, choice(
      $.identifier,
      $._atom_number,
      $.atom_hex_number,
      $.atom_short_string,
      $.atom_hint,
      $.atom_reg,
      $.function_call,
      $.atom_deref,
      $.atom_subscript,
      $.atom_dot,
      $.atom_cast,
      $.atom_tuple_or_parentheses,
    )),

    _atom_number: $ => $.number,

    atom_hex_number: $ => /0x[a-f|A-F|0-9]*/,

    string: $ => /"(.*?)"/,

    atom_short_string: $ => /'(.*?)'/,

    atom_hint: $ => seq('nondet', $.hint),

    atom_reg: $ => choice(
      'ap',
      'fp'
    ),

    atom_func_call: $ => $.function_call,

    atom_deref: $ => seq(
      '[',
      $._expr,
      ']',
    ),

    atom_subscript: $ => prec(5, seq(
      $._atom, '[', $._expr, ']',
    )),

    atom_dot: $ => seq(
      $._atom, '.', $.identifier_def,
    ),

    atom_cast: $ => seq(
      'cast', '(', $._expr, ',', $.type, ')'
    ),

    atom_tuple_or_parentheses: $ => $.arg_list,

    expr_pow: $ => seq(
      $._atom, '**', $._pow
    ),

    unary_addressof: $ => seq(
      '&', $._unary,
    ),

    unary_neg: $ => seq(
      '-', $._unary,
    ),

    unary_new_operator: $ => seq(
      'new', $._unary,
    ),

    expr_mul: $ => prec(3, seq(
      $._product, '*', $._unary
    )),

    expr_div: $ => prec(3, seq(
      $._product, '/', $._unary
    )),

    expr_add: $ =>  prec(2, seq(
      $._sum, '+', $._product
    )),

    expr_sub: $ => prec(2, seq(
      $._sum, '-', $._product,
    )),


    _expr_assignment: $ => choice(
      $._expr,
      seq($.identifier_def, '=', $._expr)
    ),

    function_call: $ => prec(6, seq(
      $.identifier,
      optional(seq(
        '{', sep(',', $.arg_list_item), '}'
      )),
      $.arg_list
    )),

    func: $ => seq(
      optional($.decorator_list),
      $._funcdecl,
      optional($.code_block),
      "end"
    ),

    decorator_list: $ => seq(
      repeat1($.decorator)
    ),

    decorator: $ => seq(
      '@',
      $.identifier_def
    ),

    _funcdecl: $ => seq(
      "func",
      $.identifier_def,
      optional($.implicit_arguments),
      $.arguments,
      optional($.returns),
      ":"
    ),

    returns: $ => seq(
      '->',
      $.arguments
    ),

    _ref_binding: $ => choice(
      $.typed_identifier,
      seq( "(", sep(",", $.typed_identifier), ")")
    ),

    code_element_reference: $ => seq(
      "let", $._ref_binding, "=", $.rvalue,
    ),

    code_element_local_var: $ => seq(
      "local", $.typed_identifier, optional(seq("=", $._expr)),
    ),

    code_element_temp_var: $ => seq(
      "tempvar", $.typed_identifier, optional(seq("=", $._expr)),
    ),

    code_element_compound_assert_eq: $ => seq(
      "assert", $._expr, "=", $._expr,
    ),

    code_element_static_assert: $ => seq(
      "static_assert", $._expr, "==", $._expr,
    ),

    code_element_const: $ => seq(
      "const", $.identifier, "=", $._expr
    ),

    code_element_struct: $ => seq(
      optional($.decorator_list),
      choice("struct", "namespace"), $.identifier_def, ":",
      optional($.code_block),
      "end"
    ),

    code_element_typedef: $ => seq(
      "using", $.identifier_def, "=", $.type,
    ),

    _attr_val: $ => seq(
      "(", optional($.string), ")"
    ),

    code_element_with_attr_statement: $ => seq(
      "with_attr", $.identifier_def, optional($._attr_val), ":",
      $.code_block,
      "end"
    ),

    code_element_with_statement: $ => seq(
      "with", sep1(",", $.aliased_identifier), ":",
      $.code_block,
      "end"
    ),

    code_element_member: $ => seq(
      "member", $.typed_identifier,
    ),

    code_element_function: $ => $.func,

    rvalue: $ => choice(
      $.call_instruction,
      $._expr,
    ),

    call_instruction: $ => choice(
      seq("call", "rel", $._expr),
      seq("call", "abs", $._expr),
      seq("call", $.identifier)
    ),

    typed_identifier: $ => seq(
      optional("local"),
      $.identifier_def,
      optional(seq(":", $.type))
    ),

    identifier_def: $ => IDENTIFIER,

    identifier: $ => prec.right(1, sep1(".", IDENTIFIER)),

    word: $ => $.identifier,

    number: $ => /\d+/,

    comment: $ => token(seq('#', /.*/)),
  }
});

function sep(separator, rule) {
  return optional(sep1(separator, rule));
}

function sep1(separator, rule) {
  return seq(rule, repeat(seq(separator, rule)));
}