import _ from 'lodash'
import invariant from 'invariant'

import { awaitHash } from './utils'

const rules = {
  // async validator(fieldValue, param, fieldName, fields, schema)
  required: (fieldValue, required, fieldName) => (
    !fieldValue
      && required
      && `field "${fieldName}" is required`
  ),
  minLength: (fieldValue, minValue, fieldName) => (
    (fieldValue.length < minValue)
      && `field "${fieldName}" must have at least ${minValue} characters`
  ),
  maxLength: (fieldValue, maxValue, fieldName) => (
    (fieldValue.length > maxValue)
      && `field "${fieldName}" must have at most ${minValue} characters`
  ),
  match: (fieldValue, pattern, fieldName) => (
    !`${fieldValue}`.match(pattern)
      && `field "${fieldName}" does not match`
  )
}

const typeValidators = {
  number: _.isNumber,
  string: _.isString
}

const validateField = async (fieldSchema, fieldName, schema, data) => {
  const value = data[fieldName]

  // Validate type.
  /*
  const isValid = typeValidators[fieldSchema.type](value)
  if (!isValid) {
    return 'invalid type'
  }
  */

  // Validate rules.
  let error
  _.some(fieldSchema.rules, (param, ruleName) => {
    const rule = rules[ruleName]
    invariant(
      !!rule,
      `rule "${ruleName}" is not defined`
    )

    error = rules[ruleName](
      value, param, fieldName, data, schema
    )
    return error
  })

  return error
}

export const validate = async (schema, data, options) => {
  // `pickBy` removes the valid fields from the errors hash.
  const errors = _.pickBy(
    await awaitHash(_.mapValues(
      schema, _.partialRight(validateField, data)
    ))
  )

  return _.isEmpty(errors) ? null : errors
}
