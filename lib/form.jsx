import React, { PropTypes } from 'react'

import { renderFields } from './fields'
import { validate } from './validate'

export default
class Form extends React.Component {

  static propTypes = {
    value: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object
    ]).isRequired,
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
    submitComponent: PropTypes.func.isRequired,
    submitComponentProps: PropTypes.object
  };

  static defaultProps = {
    validate,
    value: {}
  };

  constructor(props) {
    super(...arguments)
    this.state = {
      value: props.value,
      submitError: null
    }
  }

  async submit() {
    const { value } = this.state

    this.setState({ submitError: null })

    // Perform client-side validation
    const fieldErrors = await this.props.validate(this.props.schema, value)
    if (!_.isEmpty(fieldErrors)) {
      this.setState({ submitError: { fieldErrors } })
      return
    }

    let res
    try {
      res = await this.props.submit(value)
    } catch (submitError) {
      console.error(submitError)
      this.setState({ submitError })
      return
    }

    if (this.props.afterSubmit) {
      await this.props.afterSubmit(value, res)
    }
  }

  reset() {
    this.setState({ value: this.props.value })
  }

  renderError() {
    const error = this.state.submitError
      && this.state.submitError.summaryError
    return error ? (
      <div className="Form-error">{error}</div>
    ) : null
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
        && this.state.submitError.fieldErrors,
      fieldsContext: {
        renderSubmit: ::this.renderSubmit,
        submit: ::this.submit,
        reset: ::this.reset
      },
      fieldComponentProps: this.props.fieldComponentProps
    }

    return (
      <div className="Form">
        {this.renderError()}
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
