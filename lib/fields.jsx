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
        fieldComponentProps: PropTypes.object
      })
    ).isRequired,
    render: PropTypes.func,
    /**
     * The field values
     */
    value: PropTypes.object,
    /**
     * onChange(values, fieldName, fieldValue)
     */
    onChange: PropTypes.func,
    /**
     * A hash of field name to error message
     */
    errors: PropTypes.object,
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
    fieldComponents: PropTypes.object,
    /**
     * An array of fields to display. If this is not specificed, all
     * fields will be displayed.
     */
    fields: PropTypes.array
  };

  static defaultProps = {
    fieldComponents: {}
  };

  constructor(props) {
    super(...arguments)
    this.state = {
      values: props.value || {}
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value) {
      this.setState({ values: nextProps.value })
    }
  }

  changeField(fieldName, value) {
    const values = { ...this.state.values, [fieldName]: value }
    this.setState({ values })
    if (this.props.onChange) {
      this.props.onChange(values, fieldName, value)
    }
  }

  renderField(fieldName) {
    const fieldSchema = this.props.schema[fieldName]
    invariant(
      !!fieldSchema,
      `render('${fieldName}') failed because the field "${fieldName}" `
        + `is not defined in the schema.`
    )

    const FieldComponent = fieldSchema.component
      || this.props.fieldComponents[fieldSchema.type]

    invariant(
      FieldComponent,
      `field "${fieldName}" has a type "${fieldSchema.type}" that does not `
        + `have a component`
    )

    const errorMessage = (this.props.errors || {})[fieldName]
    const error = errorMessage ? (
      <span className="Field-error">{errorMessage}</span>
    ) : null

    return (
      <div key={fieldName}>
        {error}
        <FieldComponent
          value={this.state.values[fieldName]}
          onChange={(value) => this.changeField(fieldName, value)}
          {...fieldSchema.fieldComponentProps}
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
      render: ::this.renderField
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
  return (schema, options, renderFunc) => (
    renderFields(
      schema, {
        fieldComponents: {
          string: TextInput,
          number: NumberInput
        },
        ...baseOptions,
        ...options
      }, renderFunc
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
    fieldComponents: {
      string: TextInput,
      number: NumberInput
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
