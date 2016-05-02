import _ from 'lodash'
import React, { PropTypes } from 'react'
import invariant from 'invariant'

import { normalizeSchema } from './utils'

// Default field components
import TextInput from './components/TextInput'
import NumberInput from './components/NumberInput'

const defaultFieldTypes = {
  string: { fieldComponent: TextInput },
  number: { fieldComponent: NumberInput }
}

const schemaPropType = PropTypes.oneOfType([
  PropTypes.shape({
    title: PropTypes.string,
    type: PropTypes.oneOf([
      'array', 'object', 'string', 'integer', 'date', 'datetime'
    ]),
    rules: PropTypes.object,
    fieldComponent: PropTypes.func,
    fieldComponentProps: PropTypes.object,
    schema: PropTypes.oneOfType([
      () => schemaPropType(...arguments),
      PropTypes.objectOf(() => schemaPropType(...arguments))
    ])
  }),
  PropTypes.objectOf(() => schemaPropType(...arguments))
])

const errorMessagePropType = PropTypes.oneOfType([
  PropTypes.node,
  PropTypes.string
])

const errorPropType = PropTypes.shape({
  formError: errorMessagePropType,
  message: errorMessagePropType,
  childErrors: PropTypes.objectOf(() => errorPropType(...arguments))
})

class Fields extends React.Component {

  static propTypes = {
    /**
     * The field schema
     */
    schema: schemaPropType.isRequired,
    render: PropTypes.func.isRequired,
    /**
     * The field values
     */
    value: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object
    ]).isRequired,
    /**
     * onChange(value, fieldName, fieldValue)
     */
    onChange: PropTypes.func,
    /**
     * The field error
     */
    error: errorPropType,
    /**
     * If true, renders the values without the field component
     */
    readOnly: PropTypes.bool,
    /**
     * If true, shows a label beside each field
     */
    showLabels: PropTypes.bool,
    /**
     * A hash of field type to component. These can be replaced with
     * field-level declarations as well.
     */
    fieldTypes: PropTypes.objectOf(
      PropTypes.shape({
        fieldComponent: PropTypes.func,
        fieldComponentProps: PropTypes.object
      })
    ),
    /**
     * An array of fields to display. If this is not specificed, all
     * fields will be displayed.
     */
    fields: PropTypes.array,
    renderContext: PropTypes.object,
    fieldComponentProps: PropTypes.object,

    id: PropTypes.string
  };

  static defaultProps = {
    fieldComponents: {},
    value: {}
  };

  constructor(props) {
    super(...arguments)
    this.loadProps(props)
  }

  componentWillReceiveProps(nextProps) {
    this.loadProps(nextProps)
  }

  loadProps(props) {
    this.schema = normalizeSchema(props.schema)
  }

  changeField(fieldPath, fieldValue, fieldPathString) {
    this.checkFieldPath(fieldPath)

    // TODO: replace with immutable `_.set`
    // https://github.com/lodash/lodash/issues/1696
    const value = fieldPath ? _.set(
      Object.assign({}, this.props.value),
      fieldPath,
      fieldValue
    ) : fieldValue

    if (this.props.onChange) {
      this.props.onChange(value, fieldPathString, fieldValue, fieldPath)
    }
  }

  renderFieldWithProps(fieldPath, props) {
    return this.renderField(fieldPath, props)
  }

  renderFieldWithComponent(fieldPath, Component, props) {
    return this.renderField(fieldPath, props, Component)
  }

  checkFieldPath(fieldPath) {
    invariant(
      !(fieldPath && this.schema.type !== 'object'),
      `Only object types support named fields.`
    )
  }

  getFieldData(fieldPath) {
    // Normalize the field path.
    let fieldPathString = null
    if (_.isString(fieldPath)) {
      fieldPathString = fieldPath
      fieldPath = fieldPath.split('.')
    }

    this.checkFieldPath(fieldPath)

    const fieldSchema = fieldPath
      ? _.get(this.schema, _.flatMap(fieldPath, p => ['schema', p]))
      : this.schema

    invariant(
      !!fieldSchema,
      `render('${fieldPathString}') failed because the field `
        + `"${fieldPathString}" is not defined in the schema.`
    )

    // Get the error message.
    const fieldError = fieldPath
      ? _.get(this.props.error, _.flatMap(fieldPath, p => ['fieldErrors', p]))
      : this.props.error

    // Get the field value.
    const value = fieldPath
      ? _.get(this.props.value, fieldPath)
      : this.props.value

    // Get the field type options.
    const fieldType = this.props.fieldTypes
      && this.props.fieldTypes[fieldSchema.type]

    return {
      id: this.props.id && [this.props.id]
        .concat(fieldPath || []).join('__'),
      fieldPath,
      fieldPathString,
      fieldSchema,
      fieldError,
      fieldType,
      value,
      onChange: fieldValue => (
        this.changeField(fieldPath, fieldValue, fieldPathString)
      )
    }
  }

  getPropsForFieldData(fieldData) {
    const { fieldSchema, fieldType } = fieldData

    const fieldComponentProps = {
      ...this.props.fieldComponentProps,
      ...fieldSchema.fieldComponentProps,
      ...(fieldType && fieldType.fieldComponentProps)
    }

    return {
      id: fieldData.id,
      value: fieldData.value,
      onChange: fieldData.onChange,
      error: fieldData.fieldError,
      schema: fieldData.fieldSchema,
      // TODO: This information needs to come from `isFieldRequired`,
      // an independent callback prop.
      required: _.get(fieldData.fieldSchema, ['rules', 'required']),
      ...fieldComponentProps,
      fieldComponentProps
    }
  }

  propsFor(fieldPath) {
    const fieldData = this.getFieldData(fieldPath)
    return this.getPropsForFieldData(fieldData)
  }

  renderField(rawFieldPath, fieldProps, fieldComponent) {
    const fieldData = this.getFieldData(rawFieldPath)
    const props = this.getPropsForFieldData(fieldData)
    const {
      fieldSchema,
      fieldType,
      fieldPathString,
      fieldError
    } = fieldData

    const FieldComponent = fieldComponent
      || fieldSchema.fieldComponent
      || (fieldType && fieldType.fieldComponent)

    invariant(
      FieldComponent,
      `field "${fieldPathString}" has a type "${fieldSchema.type}" that does not `
        + `have a component`
    )

    // TODO: merge fieldProps.onChange with props.onChange
    return (
      <div key={fieldPathString}>
        <FieldComponent {...props} {...fieldProps}/>
      </div>
    )
  }

  render() {
    return this.props.render({
      render: ::this.renderFieldWithProps,
      renderComponent: ::this.renderFieldWithComponent,
      propsFor: ::this.propsFor,
      value: this.props.value,
      ...this.props.renderContext
    })
  }
}

/**
 * Creates a `renderFields` function with a specified set of base
 * options. If no options are specified, sensible defaults will be
 * used instead.
 *
 * @param {?Object} baseOptions - base options for `renderFields`
 */
export const createFieldRenderer = (baseOptions) => (
  (schema, options, render) => (
    renderFields(
      schema, { ...baseOptions, ...options }, render
    )
  )
)

/**
 * A helper for rendering the `Fields` component.
 *
 * @param {Object} schema - `props.schema`
 * @param {?Object} options - `props`
 * @param {?Function} render - `props.render`
 */
export const renderFields = (schema, options, render) => (
  <Fields
    schema={schema}
    render={render}
    fieldTypes={defaultFieldTypes}
    {...options}
  />
)
