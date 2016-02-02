import React, { PropTypes } from 'react'

import { renderFields } from './fields'
import { validate } from './validate'

export default
class Form extends React.Component {

  static propTypes = {
    validate: PropTypes.func.isRequired,
    /**
     * returns:
     * {
     *   "summaryError": "Summary error message",
     *   "fieldErrors": {
     *     "field_name": "Field error message"
     *   }
     * }
     */
    submit: PropTypes.func.isRequired,
    /**
     * Called only after `submit` returns a falsy value.
     */
    afterSubmit: PropTypes.func,
    /**
     * All forms have a submit button to trigger submit actions. Since
     * button types and text will change, you can specify a different
     * type of button for the form.
     */
    renderSubmitButton: PropTypes.func.isRequired,
    buttonTitle: PropTypes.string
  };

  static defaultProps = {
    validate,
    renderSubmitButton: (onClick, props) => (
      <button onClick={onClick}>
        {props.buttonTitle || 'Submit'}
      </button>
    )
  };

  constructor() {
    super(...arguments)
    this.state = {
      values: {},
      errors: null
    }
  }

  onChange(values, fieldName, value) {
    this.setState({ values })
  }

  async save() {
    // validate
    let errors
    try {
      errors = await this.props.submit(this.state.values)
    } catch (c) {
      console.log(c)
    }

    this.setState({ errors })
  }

  renderError() {
    const error = this.props.errors && this.props.errors.summaryError
    return error ? (
      <div className="Form-error">{error}</div>
    ) : null
  }

  render() {
    const options = {
      onChange: ::this.onChange,
      fields: this.props.fields,
      showLabels: this.props.showLabels,
      fieldComponents: this.props.fieldComponents,
      errors: this.props.errors && this.props.errors.fieldErrors
    }

    return (
      <div className="Form">
        {this.renderError()}
        {renderFields(this.props.schema, options, this.props.render)}
        {this.props.renderSubmitButton(::this.submit, this.props)}
      </div>
    )
  }
}

export const createFormRenderer = (baseOptions) => {
  return (schema, options, render) => (
    renderForm(
      schema, { ...baseOptions, ...options }, render
    )
  )
}

/**
 * renderForm arguments are similar to {@link renderFields}
 * The form handles validation, displaying validation errors, and
 * displaying a submit button for a form. Think of this as an
 * extension of renderFields that can handle the submit button
 * and validations as well.
 *
 * #### Form Lifecycle
 *
 * When the submit button is clicked, the fields are validated
 * client-side with `props.validate`. If there are errors, they will
 * be displayed and execution will end. If there were no errors,
 * `props.submit` will be called with the field values, and it will
 * respect an error payload in return.
 */
export const renderForm = (schema, options, renderFunc) => (
  <Form
    schema={schema}
    render={render}
    {...options}
  />
)
