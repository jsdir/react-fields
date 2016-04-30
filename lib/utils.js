import _ from 'lodash'

/**
 * This can be used to mount form state to a path in local
 * component state.
 * @param component - The component instance to mount the state to.
 * @param {array} path - The path of the mounted data within
 * component state.
 */
export const bindValue = (component, path) => ({
  value: _.get(component.state, path),
  onChange: value => {
    component.setState(_.set(component.state, path, {
        ..._.get(component.state, path),
        ...value
    }))
  }
})

/**
 * Mimics the yield hash.
 * @function
 * @param {object} hash - a hash where values are promises or null
 * @returns {object} resolved `hash` where all values are resolved
 */
export const awaitHash = async (hash) => _.zipObject(
  _.keys(hash),
  await Promise.all(_.values(hash))
)

export const normalizeSchema = schema => (
  // Only normalize the schema if it exists.
  _.isObject(schema) ? (
    // In both cases, the schema is recursively normalized.
    (schema.type === 'object' || !schema.type) ? {
      // If no type is specified, the schema is assumed
      // to be an object definition.
      type: 'object',
      rules: schema.rules,
      schema: _.mapValues(
        (schema.type ? schema.schema : schema),
        normalizeSchema
      )
    } : {
      ...schema,
      schema: normalizeSchema(schema.schema)
    }
  ) : schema
)
