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
    buttonTitle: PropTypes.string,

    submitComponent: PropTypes.node.isRequired,
    submitComponentProps: PropTypes.object
  };

  static defaultProps = {
    validate
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

  async submit() {
    const { values } = this.state

    this.setState({ errors: null })

    const fieldErrors = await this.props.validate(this.props.schema, values)
    if (!_.isEmpty(fieldErrors)) {
      this.setState({ errors: { fieldErrors } })
      return
    }

    // validate
    let errors
    try {
      errors = await this.props.submit(values)
    } catch (err) {
      this.setState({
        errors: {
          summaryError: 'There was an error submitting the form'
        }
      })
      return
    }

    this.setState({ errors })

    if (this.props.afterSubmit) {
      this.props.afterSubmit(values)
    }
  }

  renderError() {
    const error = this.state.errors
      && this.state.errors.summaryError
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
      errors: this.state.errors && this.state.errors.fieldErrors,
      fieldsContext: {
        Submit: React.cloneElement(this.props.submitComponent, {
          ...this.props.submitComponentProps,
          onClick: ::this.submit
        })
      }
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
