import _ from 'lodash';

const rules = {
  required: (fieldValue, required, fieldName) => (
    !fieldValue
      && required
      && `field "${fieldName}" is required`
  )
  //async validator(fieldValue, param, fieldName, fields, schema)
}

const typeValidators = {
  number: _.isNumber,
  string: _.noop
};

function validateType() {

}

async function validateField(fieldSchema, fieldName, schema, data) {
  const value = data[fieldName];

  // Validate type.
  // const isValid = typeValidators[fieldSchema.type](value);
  // if (!isValid) {
  //   return 'invalid type'
  // }

  // Validate rules.
  let error
  _.some(fieldSchema.rules, (param, ruleName) => {
    error = rules[ruleName](
      value, param, fieldName, data, schema
    )
    return error
  })

  return error
}

export async function awaitHash(hash) {
  return _.zipObject(
    _.keys(hash),
    await Promise.all(_.values(hash))
  )
}

export async function validate(schema, data, options) {
  // `pickBy` removes the valid fields from the errors hash.
  const errors = _.pickBy(
    await awaitHash(_.mapValues(
      schema, _.partialRight(validateField, data)
    ))
  )

  return _.isEmpty(errors) ? null : errors
}
