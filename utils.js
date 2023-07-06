const PREC = {
  PAREN: -1,
  ASSIGN: 1,
  LOGICAL_OR: 3,
  LOGICAL_AND: 4,
  EQUALITY: 7,
  ADDITIVE: 8,
  MULTIPLICATIVE: 9,
  SHIFT: 10,
  BITAND: 11,
  BITXOR: 12,
  BITOR: 13,
  UNARY: 14,
  POWER: 15,
  CALL: 16,
  MEMBER: 17,
};

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
  return optional(seq(sep1(rule, ','), optional(',')));
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

/**
* Creates a rule to match zero or more of the rules separated by the separator
*
* @param {Rule} rule
* @param {string|Rule} separator - The separator to use.
*
* @return {SeqRule}
*
*/
function optionalSep1(rule, separator) {
  return optional(sep1(rule, separator));
}

module.exports = {
  PREC,
  optionalCommaSep,
  commaSep,
  commaSep1,
  sep1,
  optionalSep1,
};
