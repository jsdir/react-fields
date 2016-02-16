import React, { PropTypes } from 'react'

import { normalizeSchema } from './utils'
import { renderFields } from './fields'
import { validate } from './validate'

export default
class Form extends React.Component {

  static propTypes = {
    value: PropTypes.any,
    validate: PropTypes.func.isRequired,
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
    submitComponent: PropTypes.func.isRequired,
    submitComponentProps: PropTypes.object,
    showFormError: PropTypes.bool,
    renderFormError: PropTypes.func
  };

  static defaultProps = {
    validate,
    value: {},
    showFormError: true,
    renderFormError: message => (
      <div className="Form-error">{message}</div>
    )
  };

  constructor(props) {
    super(...arguments)
    this.loadProps(props)
    this.state = {
      value: props.value,
      submitError: null
    }
  }

  componentWillReceiveProps(nextProps) {
    this.loadProps(nextProps)
  }

  loadProps(props) {
    this.schema = normalizeSchema(props.schema)
  }

  async submit() {
    const { value } = this.state

    this.clearError()

    // Perform client-side validation
    const submitError = await this.props.validate(this.schema, value)
    if (submitError) {
      this.setState({ submitError })
      return false
    }

    let res
    try {
      res = await this.props.submit(value)
    } catch (submitError) {
      console.error(submitError)
      this.setState({ submitError })
      return false
    }

    if (this.props.afterSubmit) {
      await this.props.afterSubmit(value, res)
    }
  }

  reset() {
    this.setState({ value: this.props.value })
  }

  clearError() {
    this.setState({ submitError: null })
  }

  renderFormError() {
    const message = this.state.submitError
      && this.state.submitError.formError
    return message
      ? this.props.renderFormError(message)
      : null
  }

  renderSubmit(props) {
    const Submit = this.props.submitComponent
    return (
      <Submit
        {...this.props.submitComponentProps}
        {...props}
        onClick={::this.submit}
      />
    )
  }

  render() {
    const SubmitComponent = this.props.submitComponent
    const Submit = (
      <SubmitComponent
        {...this.props.submitComponentProps}
        onClick={::this.submit}
      />
    )

    // Allow some props to pass down to `renderFields`.
    const options = {
      value: this.state.value,
      onChange: value => this.setState({ value }),
      fields: this.props.fields,
      showLabels: this.props.showLabels,
      fieldTypes: this.props.fieldTypes,
      error: this.state.submitError
        && this.state.submitError.error,
      fieldsContext: {
        renderFormError: ::this.renderFormError,
        renderSubmit: ::this.renderSubmit,
        submit: ::this.submit,
        reset: ::this.reset
      },
      fieldComponentProps: {
        ...this.props.fieldComponentProps,
        clearError: ::this.clearError
      }
    }

    return (
      <div className="Form">
        {this.props.showFormError ? this.renderFormError() : null}
        {renderFields(this.props.schema, options, this.props.render)}
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
export const renderForm = (schema, options, render) => (
  <Form
    schema={schema}
    render={render}
    {...options}
  />
)
