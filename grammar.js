module.exports = grammar({
  name: 'cairo',
  
  extras: $ => [/\s/, $.comment],

  rules: {
    cairo_file: $ => $.code_block,

    code_block: $ => repeat1($._code_element),

    _code_element: $ => choice(
      $.code_element_member,
      $.code_element_reference,
      $.code_element_return,
      $.code_element_function,
      $.code_element_directive,
      $.code_element_import,
      $.code_element_instruction,
    ),


    implicit_arguments: $ => seq(
      '{',
      optional(seq(
        repeat(
          seq(
            $.identifier,
            optional(seq( ':', $.type, ','))
        )),
        $.identifier,
        optional(seq( ':', $.type))
      )),
      '}'
    ),

    arguments: $ => seq(
      '(',
      optional(seq(
        repeat(
          seq( $.identifier, ':', $.type, ',')
        ),
        $.identifier,
        ':',
        $.type
      )),
      ')'
    ),

    type: $ => choice(
      'felt',
      $.identifier, // structure
      seq( $.type, '*'),
      seq( $.type, '**')
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

    inst_jnz: $ => seq(
      'jmp', 'rel', $._expr, 'if', $._expr, '!=', $.number,
    ),

    inst_jnz_to_label: $ => seq(
      'jmp', $.identifier, 'if', $._expr, '!=', $.number,
    ),

    inst_ret: $ => 'ret',

    inst_add_ap: $ => seq(
      'ap', '+=', $._expr,
    ),

    inst_data_word: $ => seq(
      'dw', $._expr,
    ),



    code_element_import: $ => seq(
      'from', $._identifier_def, 'import', $.import_body,
    ),

    import_body: $ => seq(
      $.aliased_identifier,
      repeat(seq( ',', $.aliased_identifier,))
    ),

    aliased_identifier: $ => seq(
      $._identifier_def,
      optional(seq(
        'as',
        $._identifier_def
      ))
    ),

    code_element_directive: $ => choice(
      $.builtin_directive,
      $.lang_directive,
    ),

    builtin_directive: $ => seq(
      '%builtins', $.identifier
    ),

    lang_directive: $ => seq(
      '%lang', $.identifier
    ),

    code_element_return: $ => seq(
      'return', '(', optional($.arg_list), ')',
    ),

    arg_list: $ => choice(
      $.arg_list_item,
      seq(
        $.arg_list_item,
        repeat1(seq(
          ',',
          $.arg_list_item
        ))
      )
    ),

    arg_list_item: $ => $._expr_assignment,

    _expr: $ => prec.left(2, $._sum),

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
    )),

    _pow: $ => prec(4, choice(
      $._atom,
      $.expr_pow,
    )),

    _atom: $ => prec(5, choice(
      $._atom_number,
      $.atom_hex_number,
      $.atom_short_string,
      $.atom_hint,
      $.atom_reg,
      $.atom_func_call,
      $.identifier,
      $.atom_deref,
      $.atom_subscript,
      $.atom_dot,
      $.atom_cast,
      $.atom_tuple_or_parentheses,
    )),

    _atom_number: $ => $.number,

    atom_hex_number: $ => /0x[a-f|A-F|0-9]*/,

    atom_short_string: $ => /'(.*?)'/,

    atom_hint: $ => seq(
      'nondet',
      /%\{(.*?)%\}/s,
    ),

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

    atom_subscript: $ => seq(
      $._atom, '[', $._expr, ']',
    ),

    atom_dot: $ => seq(
      $._atom, '.', $._identifier_def,
    ),

    atom_cast: $ => seq(
      'cast', '(', $._expr, ',', $.type, ')'
    ),

    atom_tuple_or_parentheses: $ => seq(
      '(', optional($.arg_list), ')',
    ),

    expr_pow: $ => seq(
      $._atom, '**', $._pow
    ),

    unary_addressof: $ => seq(
      '&', $._unary,
    ),

    unary_neg: $ => seq(
      '-', $._unary,
    ),

    expr_mul: $ => seq(
      $._product, '*', $._unary
    ),

    expr_div: $ => seq(
      $._product, '/', $._unary
    ),

    expr_add: $ =>  seq(
      $._sum, '+', $._product
    ),

    expr_sub: $ => seq(
      $._sum, '-', $._product,
    ),


    _expr_assignment: $ => choice(
      $._expr,
      seq($._identifier_def, '=', $._expr)
    ),

    function_call: $ => seq(
      $.identifier,
      optional(seq(
        '{', $.arg_list, '}'
      )),
      '(', optional($.arg_list), ')',
    ),

    func: $ => seq(
      optional($.decorator_list),
      $._funcdecl,
      $.code_block,
      "end"
    ),

    decorator_list: $ => seq(
      repeat1($.decorator)
    ),

    decorator: $ => seq(
      '@',
      $._identifier_def
    ),

    _funcdecl: $ => seq(
      "func",
      $._identifier_def,
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
      seq( "(", $.typed_identifier, ")")
    ),

    code_element_reference: $ => seq(
      "let", $._ref_binding, "=", $.rvalue,
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
      seq( "call", "rel", $._expr),
      seq( "call", "abs", $._expr),
      seq( "call", $.identifier)
    ),

    typed_identifier: $ => seq(
      optional("local"),
      $._identifier_def,
      optional(seq(
        ":",
        $.type
      ))
    ),

    tuple: $ => seq(
      '(',
      optional(seq(
        optional(' '),
        $.type,
        optional(' '),
        ',',
        optional(' ')
      )),
      ')',
    ),

    _identifier_def: $ => prec.left(2, seq(
      $.identifier,
      repeat(seq(
        '.',
        $.identifier
      ))
    )),

    identifier: $ => /[a-zA-Z_][a-zA-Z_0-9]*/,

    word: $ => $.identifier,

    number: $ => /\d+/,

    comment: $ => token(seq('#', /.*/)),
  }
});
