import _ from 'lodash'
import invariant from 'invariant'

import { awaitHash } from './utils'

const getRequiredMessage = title => `${title} is required`

const pluralize = (count, itemName) => itemName + (count !== 1 ? 's' : '')

const pluralizeLength = (count, value) => (
  pluralize(count, _.isString(value) ? 'character' : 'item')
)

const isEmpty = value => (
  _.isUndefined(value) || _.isNull(value) || value === ''
)

export const rules = {
  required: ({ value, param: required, title }) => (
    required && isEmpty(value) && getRequiredMessage(title)
  ),
  requiredIf: ({
    ...props,
    value,
    rootValue,
    param: shouldBeRequired, title
  }) => (
    shouldBeRequired(rootValue, props)
      && isEmpty(value)
      && getRequiredMessage(title)
  ),
  min: ({ value, param: minValue, title }) => (
    (value < minValue)
      && `${title} must not be less than ${minValue}`
  ),
  max: ({ value, param: maxValue, title }) => (
    (value > maxValue)
      && `${title} must not be more than ${value}`
  ),
  minLength: ({ value, param: minValue, title }) => (
    (value.length < minValue)
      && `${title} must have at least ${minValue} ${pluralizeLength(minValue, value)}`
  ),
  maxLength: ({ value, param: maxValue, title }) => (
    (value.length > maxValue)
      && `${title} must not have more than ${maxValue} ${pluralizeLength(maxValue, value)}`
  ),
  match: ({ value, param: pattern, title }) => (
    !isEmpty(value)
      && !`${value}`.match(pattern)
      && `${title} does not match pattern ${pattern}`
  ),
  custom: props => props.param(props)
}

const normalizeObject = (obj) => {
  const pickObj = _.pickBy(obj)
  return _.isEmpty(pickObj) ? null : pickObj
}

const validateNode = async (schema, value, node) => {
  for (let ruleName in schema.rules) {
    const rule = rules[ruleName]
    invariant(
      !!rule,
      `no rule named "${ruleName}"`
    )

    // Normalize the parameter.
    let param = schema.rules[ruleName]
    if (!_.isObject(param) || _.isUndefined(param.param)) {
      param = { param }
    }

    const ruleOptions = {
      value,
      schema,
      param: param.param,
      title: schema.title || node.title,
      rootValue: node.rootValue
    }

    let message = await rule(ruleOptions)

    if (message) {
      // Custom errors
      if (param.errorMessage) {
        message = _.isFunction(param.errorMessage)
          ? param.errorMessage(ruleOptions)
          : param.errorMessage
      }

      return _.isObject(message)
        ? message
        : { [ param.formError ? 'formError' : 'message' ]: message }
    }
  }

  return {}
}

const getChildFormError = childErrors => {
  let childFormError
  childErrors = childErrors ? _.mapValues(childErrors, error => {
    if (!error) {
      return null
    } else {
      childFormError = childFormError || error.formError
      return normalizeObject(_.omit(error, 'formError'))
    }
  }) : null

  return {
    childErrors: normalizeObject(childErrors),
    childFormError
  }
}

const validate = async (schema, data, node) => {
  // We'll make some assumptions about the root node.
  node = node || {
    title: `Root ${schema.type}`,
    rootValue: data
  }

  const errorPromise = validateNode(schema, data, node)

  // Validate nested values
  let childErrorAttr, childErrorHash
  switch (schema.type) {
    case 'object':
      childErrorAttr = 'fieldErrors'
      childErrorHash = _.mapValues(
        schema.schema, (fieldSchema, name) => validate(
          fieldSchema, data && data[name], {
            ...node,
            // The field name can be used as the title.
            title: _.startCase(name) || name
          }
        )
      )
      break
    case 'array':
      childErrorAttr = 'itemErrors'
      childErrorHash = _.fromPairs(data.map((item, i) => [
        i, validate(schema.schema, item, {
          ...node,
          title: 'List item'
        })
      ]))
      break
  }

  const childErrorsWithFormError = childErrorHash
    && await awaitHash(childErrorHash)
  const { childFormError, childErrors } = getChildFormError(childErrorsWithFormError)
  const errorResult = await errorPromise

  return normalizeObject({
    ...(childErrors && { [childErrorAttr]: childErrors }),
    ...errorResult,
    // Lift the form error if it already exists in
    // the child errors.
    formError: childFormError || errorResult.formError
  })
}

export default validate
