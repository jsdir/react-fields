import _ from 'lodash'
import React, {PropTypes} from 'react'
import invariant from 'invariant'
import titleize from 'titleize'

import TextInput from './components/TextInput'
import NumberInput from './components/NumberInput'

// import checkSchema from './check-schema'

class Fields extends React.Component {

  static propTypes = {
    /**
     * The field schema
     */
    schema: PropTypes.object.isRequired,
    /**
     * renderFunc(field) is called with a field context as the first argument
     */
    renderFunc: PropTypes.func.isRequired,
    /**
     * The field values.
     */
    value: PropTypes.object,
    /**
     * onChange(fields, fieldName, fieldValue)
     */
    onChange: PropTypes.func,
    /**
     * A hash of field name to error message
     */
    errors: PropTypes.object,
    /**
     * Set to true to render the values without the field component.
     */
    readOnly: PropTypes.bool,
    /**
     * Set to true to show a label beside each field.
     */
    showLabels: PropTypes.bool,
    /**
     * A hash of field type to component. These can be replaced with
     * field-level declarations as well.
     */
    fieldComponents: PropTypes.object,
    /**
     * An array of fields to display.
     */
    fields: PropTypes.array
  };

  static defaultProps = {
    fieldComponents: {}
  };

  constructor(props) {
    super(props)
    this.state = {
      values: this.props.value || {}
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({values: nextProps.value})
  }

  changeField(fieldName, value) {
    const values = {...this.state.values, [fieldName]: value}
    this.setState({values})
    if (this.props.onChange) {
      this.props.onChange(values, fieldName, value)
    }
  }

  renderField(fieldName) {
    const fieldSchema = this.props.schema[fieldName]
    invariant(
      !!fieldSchema,
      `render('${fieldName}') failed because the field "${fieldName}" is not defined in the schema.`
    )

    const FieldComponent = fieldSchema.component || this.props.fieldComponents[fieldSchema.type]

    invariant(
      FieldComponent,
      `field "${fieldName}" has a type "${fieldSchema.type}" that does not have a component`
    )

    const errorMessage = (this.props.errors || {})[fieldName]
    const error = errorMessage ? (
      <span className="Field--error">{errorMessage}</span>
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
        <label>{this.props.schema[fieldName].title || titleize(fieldName)}</label>
        {this.renderField(fieldName)}
      </div>
    ))

    return (<div>{items}</div>)
  }

  render() {
    return (this.props.renderFunc || this.renderAllFields)({
      render: ::this.renderField
    })
  }
}

export function renderFields(schema, options, renderFunc) {
  // TODO: checkSchema(schema)

  // Allow the function to be called with (schema, renderFunc)
  if (!renderFunc) {
    renderFunc = options
    options = {}
  }

  return (
    <Fields
      schema={schema}
      renderFunc={renderFunc}
      {...options}
    />
  )
}

export function createFieldRenderer(baseOptions) {
  baseOptions = baseOptions || {
    fieldComponents: {
      string: TextInput,
      number: NumberInput
    }
  }

  return (schema, options, renderFunc) => (
    renderFields(
      schema, _.extend({}, baseOptions, options), renderFunc
    )
  )
}

export function bindField(component, path) {
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
