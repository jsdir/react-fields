import React, {PropTypes} from 'react'
import invariant from 'invariant'

import {titleize} from 'utils/string-utils'
import checkSchema from './check-schema'

export default
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
     * The default value to put in the fields.
     */
    defaultValues: PropTypes.object,
    /**
     * onChange(fieldName, fieldValue, fields)
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
    fieldComponents: PropTypes.object
  }

  static defaultProps = {
    fieldComponents: {}
  }

  constructor(props) {
    super(props)
    this.state = {
      values: this.props.defaultValues || {}
    }
    _.bindClass(this)
  }

  changeField(fieldName, value) {
    const values = {...this.state.values, [fieldName]: value}
    this.setState({values})
    this.onChange(fieldName, value, values)
  }

  renderField(fieldName) {
    const fieldSchema = this.props.schema[fieldName]
    invariant(
      !!fieldSchema,
      `render('${fieldName}') failed because the field "${fieldName}" is not defined in the schema.`
    )

    const FieldComponent = fieldSchema.component || this.props.fieldComponents[fieldSchema.type]

    invariant(
      !FieldComponent,
      `field "${fieldName}" has a type "${fieldSchema.type}" that does not have a component`
    )

    const errorMessage = (this.props.errors || {})[fieldName]
    const error = errorMessage ? (
      <span className="text-danger">{errorMessage}</span>
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
    const sortedFieldNames = this.props.schema.order || _.sort(fieldNames)
    return _.map(sortedFieldNames, fieldName => (
      <div>
        <label>{this.props.schema[fieldName].title || titleize(fieldName)}</label>
        {this.renderField(fieldName)}
      </div>
    ))
  }

  render() {
    return (this.props.renderFunc || this.renderAllFields)({
      render: this.renderField
    })
  }
}

export function renderFields(schema, options, renderFunc) {
  checkSchema(schema)

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
