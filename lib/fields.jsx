import _ from 'lodash'
import React, { PropTypes } from 'react'
import invariant from 'invariant'
import titleize from 'titleize'

// Default field components
import TextInput from './components/TextInput'
import NumberInput from './components/NumberInput'

class Fields extends React.Component {

  static propTypes = {
    /**
     * The field schema
     */
    schema: PropTypes.objectOf(
      PropTypes.shape({
        title: PropTypes.string,
        type: PropTypes.string.isRequired,
        rules: PropTypes.object,
        fieldComponent: PropTypes.func,
        fieldComponentProps: PropTypes.object,
        item: PropTypes.object
      })
    ).isRequired,
    render: PropTypes.func,
    /**
     * The field values
     */
    value: PropTypes.object,
    /**
     * onChange(value, fieldName, fieldValue)
     */
    onChange: PropTypes.func,
    /**
     * The field error
     */
    error: PropTypes.any,
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
    fieldsContext: PropTypes.object
  };

  static defaultProps = {
    fieldComponents: {}
  };

  constructor(props) {
    super(...arguments)
    this.state = {
      value: props.value || {}
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value) {
      this.setState({ value: nextProps.value })
    }
  }

  changeField(fieldPath, fieldValue, fieldPathString) {
    // TODO: replace with immutable `_.set`
    // https://github.com/lodash/lodash/issues/1696
    const value = fieldPath
      ? _.set(Object.assign({}, this.state.value), fieldPath, fieldValue)
      : fieldValue

    this.setState({ value })
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

  getFieldData(fieldPath) {
    // Normalize the field path.
    let fieldPathString = null
    if (_.isString(fieldPath)) {
      fieldPathString = fieldPath
      fieldPath = fieldPath.split('.')
    }

    // Get and check the field schema.
    const fieldSchema = fieldPath
      ? _.get(this.props.schema, fieldPath)
      : this.props.schema

    invariant(
      !!fieldSchema,
      `render('${fieldPathString}') failed because the field "${fieldPathString}" `
        + `is not defined in the schema.`
    )

    // Get the error message.
    const fieldError = fieldPath
      ? _.get(this.props.error, fieldPath)
      : this.props.error

    // Get the field value.
    const value = fieldPath
      ? _.get(this.state.value, fieldPath)
      : this.state.value

    return {
      fieldPath,
      fieldPathString,
      fieldSchema,
      fieldError,
      value,
      onChange: fieldValue => (
        this.changeField(fieldPath, fieldValue, fieldPathString)
      )
    }
  }

  propsFor(fieldPath) {
    const fieldData = this.getFieldData(fieldPath)
    return {
      value: fieldData.value,
      onChange: fieldData.onChange,
      error: fieldData.fieldError
    }
  }

  renderField(rawFieldPath, fieldProps, fieldComponent) {
    const {
      fieldPath,
      fieldPathString,
      fieldSchema,
      fieldError,
      value,
      onChange
    } = this.getFieldData(rawFieldPath)

    const fieldType = this.props.fieldTypes
      && this.props.fieldTypes[fieldSchema.type]

    const FieldComponent = fieldComponent
      || fieldSchema.fieldComponent
      || (fieldType && fieldType.fieldComponent)

    invariant(
      FieldComponent,
      `field "${fieldPathString}" has a type "${fieldSchema.type}" that does not `
        + `have a component`
    )

    const errorMessage = fieldError ? (
      <span className="Field-error">{fieldError}</span>
    ) : null

    return (
      <div key={fieldPathString}>
        {errorMessage}
        <FieldComponent
          value={value}
          onChange={onChange}
          error={fieldError}
          schema={fieldSchema}
          {...fieldSchema.fieldComponentProps}
          {...(fieldType && fieldType.fieldComponentProps)}
          {...fieldProps}
          // TODO: merge onChange
        />
      </div>
    )
  }

  // Renders the fields based on the schema with labels.
  renderAllFields() {
    const fieldNames = _.keys(this.props.schema)
    const sortedFieldNames = this.props.fields || _.sortBy(fieldNames)
    const items = _.map(sortedFieldNames, fieldName => (
      <div key={fieldName}>
        <label>
          {this.props.schema[fieldName].title || titleize(fieldName)}
        </label>
        {this.renderField(fieldName)}
      </div>
    ))

    return (<div>{items}</div>)
  }

  render() {
    return (this.props.render || ::this.renderAllFields)({
      render: ::this.renderFieldWithProps,
      renderComponent: ::this.renderFieldWithComponent,
      propsFor: ::this.propsFor,
      value: this.state.value,
      ...this.props.fieldsContext
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
export const createFieldRenderer = (baseOptions) => {
  return (schema, options, render) => (
    renderFields(
      schema, { ...baseOptions, ...options }, render
    )
  )
}

/**
 * A helper for rendering the `Fields` component.
 *
 * @param {Object} schema - `props.schema`
 * @param {?Object} options - `props`
 * @param {?Function} render - `props.render`
 */
export const renderFields = (schema, options, render) => {
  options = {
    fieldTypes: {
      string: {
        fieldComponent: TextInput
      },
      number: {
        fieldComponent: NumberInput
      }
    },
    ..._.pickBy(options, v => v)
  }

  return (
    <Fields
      schema={schema}
      render={render}
      {...options}
    />
  )
}
