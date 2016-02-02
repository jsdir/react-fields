import _ from 'lodash'

/**
 * This can be used to mount form state to a path in local
 * component state.
 * @param component - The component instance to mount the state to.
 * @param {array} path - The path of the mounted data within
 * component state.
 */
export function bindValue(component, path) {
  return {
    value: _.get(component.state, path),
    onChange: value => {
      component.setState(_.set(component.state, path, {
        ..._.get(component.state, path),
        ...value
      }))
    }
  }
}

/**
 * Mimics the yield hash.
 * @function
 * @param {object} hash - a hash where values are promises or null
 * @returns {object} resolved `hash` where all values are resolved
 */
export async function awaitHash(hash) {
  return _.zipObject(
    _.keys(hash),
    await Promise.all(_.values(hash))
  )
}
