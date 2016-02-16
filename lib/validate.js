import _ from 'lodash'
import invariant from 'invariant'

import { awaitHash } from './utils'

const rules = {
  required: ({ value, param: required, title }) => (
    !value
      && required
      && `${title} is required`
  ),
  min: ({ value, param: minValue, title }) => (
    (value < minValue)
      && `${title} must not be less than ${minValue}`
  ),
  max: ({ value, param: maxValue, title }) => (
    (value > maxValue)
      && `${title} must not be greater than ${value}`
  ),
  minLength: ({ value, param: minValue, title }) => (
    (value.length < minValue)
      && `${title} must have at least ${minValue} characters`
  ),
  maxLength: ({ value, param: maxValue, title }) => (
    (value.length > maxValue)
      && `${title} must have at most ${maxValue} characters`
  ),
  match: ({ value, param: pattern, title }) => (
    !`${value}`.match(pattern)
      && `${title} does not match pattern ${pattern}`
  )
}

export const validateNode = async (schema, value, node) => {
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
      title: node.title,
      context: node.context
    }

    let error = await rule(ruleOptions)

    if (error) {
      // Custom errors
      if (param.errorMessage) {
        error = _.isFunction(param.errorMessage)
          ? param.errorMessage(ruleOptions)
          : param.errorMessage
      }

      return error
    }
  }

  return null
}

export const validate = async (schema, data, options = {}) => {
  const title = options.title || schema.title || `root ${schema.type}`
  const errorPromise = validateNode(schema, data, {
    ...options,
    title
  })

  // Validate nested values
  let childErrorAttr, childErrorHash
  switch (schema.type) {
    case 'object':
      childErrorAttr = 'fieldErrors'
      childErrorHash = _.mapValues(
        schema.schema, (fieldSchema, name) => validate(
          fieldSchema, data[name], {
            title: fieldSchema.title || name, context: data
          }
        )
      )
    case 'array':
      childErrorAttr = 'itemErrors'
      childErrorHash = _.fromPairs(data.map((item, i) => [
        i, validate(schema.schema, item, {
          title: `${title}[${i}]`, context: data
        })
      ]))
  }

  const childErrors = childErrorHash
    && _.pickBy(await awaitHash(childErrorHash), _.identity)

  const error = await errorPromise

  return {
    submitError: null,
    error: childErrors ? {
      error,
      ...(!_.isEmpty(childErrors) && {
        [childErrorAttr]: childErrors
      })
    } : error
  }
}
