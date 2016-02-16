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

    let message = await rule(ruleOptions)

    if (message) {
      // Custom errors
      if (param.errorMessage) {
        message = _.isFunction(param.errorMessage)
          ? param.errorMessage(ruleOptions)
          : param.errorMessage
      }

      return { message, summary: param.summary }
    }
  }

  return {}
}

export const validate = async (schema, data, node) => {
  // HACK: bug in babel
  node = node || {}
  const title = node.title || schema.title || `root ${schema.type}`
  const errorPromise = validateNode(schema, data, {
    ...node,
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
      break
    case 'array':
      childErrorAttr = 'itemErrors'
      childErrorHash = _.fromPairs(data.map((item, i) => [
        i, validate(schema.schema, item, {
          title: `${title}[${i}]`, context: data
        })
      ]))
      break
  }

  const childErrorsWithSummary = childErrorHash
    && _.pickBy(await awaitHash(childErrorHash), error => (
      _.isObject(error) ? !_.isEmpty(_.pickBy(error)) : error
    ))

  const { message, summary } = await errorPromise
  const { childErrors, childSummaryError } = getSummaryError(childErrorsWithSummary)

  let error
  if (childErrors) {
    const res = _.pickBy({
      error: message,
      ...(!_.isEmpty(childErrors) && {
        [childErrorAttr]: childErrors
      })
    })

    error = _.isEmpty(res) ? null : res
  } else {
    error = message
  }

  return normObject({
    summaryError: summary ? message : childSummaryError,
    error
  })
}

const normObject = (obj) => (
  _.isEmpty(_.pickBy(obj)) ? null : obj
)

const getSummaryError = (childErrors) => {
  let childSummaryError
  childErrors = childErrors ? _.mapValues(childErrors, error => {
    childSummaryError = childSummaryError || error.summaryError
    return error.error
  }) : null

  return {
    childErrors,
    childSummaryError
  }
}
