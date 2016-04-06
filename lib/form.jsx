import React, { PropTypes } from 'react'

import { normalizeSchema } from './utils'
import { renderFields } from './fields'
import validate from './validate'

export default
class Form extends React.Component {

  static propTypes = {
    value: PropTypes.any,
    onChange: PropTypes.func,
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
      isSubmitting: false,
      error: null
    }
  }

  componentWillReceiveProps(nextProps) {
    this.loadProps(nextProps)

    // If the value changed, we know that the component
    // is controlled, and that `props.value` is not just
    // the initial value.
    if (nextProps.value !== this.props.value) {
      this.setState({ value: nextProps.value })
    }
  }

  loadProps(props) {
    this.schema = normalizeSchema(props.schema)
  }

  setError(error) {
    this.setState({ error, isSubmitting: false })
  }

  async submit(event) {
    if (event) {
      event.preventDefault()
    }

    const { value } = this.state

    this.clearError()
    this.setState({ isSubmitting: true })

    // Perform client-side validation
    const error = await this.props.validate(this.schema, value)
    if (error) {
      this.setError(error)
      return false
    }

    let res
    try {
      res = await this.props.submit(value)
    } catch (error) {
      console.error('Form submit error:', error)
      this.setError(error)
      return false
    }

    this.setState({ isSubmitting: false })

    if (this.props.afterSubmit) {
      await this.props.afterSubmit(value, res)
    }
  }

  reset() {
    this.setState({ value: this.props.value })
    this.clearError()
  }

  clearError() {
    this.setState({ error: null })
  }

  onChange = value => {
    this.setState({ value })
    if (this.props.onChange) {
      this.props.onChange(value)
    }
  };

  renderFormError() {
    const formErrorMessage = this.state.error
      && this.state.error.formError
    return formErrorMessage
      ? this.props.renderFormError(formErrorMessage)
      : null
  }

  render() {
    // Allow some props to pass down to `renderFields`.
    const options = {
      value: this.state.value,
      onChange: this.onChange,
      fields: this.props.fields,
      showLabels: this.props.showLabels,
      fieldTypes: this.props.fieldTypes,
      error: this.state.error,
      fieldComponentProps: this.props.fieldComponentProps,
      renderContext: {
        renderFormError: ::this.renderFormError,
        submit: ::this.submit,
        clearError: ::this.clearError,
        isSubmitting: this.state.isSubmitting,
        reset: ::this.reset
      },
    }

    return (
      <div className="Form">
        {this.props.showFormError ? this.renderFormError() : null}
        {renderFields(this.props.schema, options, this.props.render)}
      </div>
    )
  }
}

export const createFormRenderer = (baseOptions) => (
  (schema, options, render) => (
    renderForm(
      schema, { ...baseOptions, ...options }, render
    )
  )
)

export const renderForm = (schema, options, render) => (
  <Form
    schema={schema}
    render={render}
    {...options}
  />
)
