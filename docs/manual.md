# Introduction

`react-fields` provides customizable form building for React, complete with type-checking, validation, and other useful utilities.

Several different form libraries were evaluated before building `react-fields`, yielding the following observations:

- *Dependence on other libraries.* A lot of the solutions used Redux as a primary dependency for form state without any options to use local state. `react-fields` uses local component state by default, but also allows you to swap in a data persistence backend when necessary no matter if it's redux, or any another state management library. let's you use redux for state, only if you want to. It allows to to switch persistence backend without having to even touch your forms.
- *Not much support for nested forms.* There were no easy ways to handle nested data. Always bound to another state management library instead of using React's local component state by default. And mapping nested validation errors back in a presentable way was very difficult. `react-fields` handles nested forms just like normal fields.
- *Validation was too opinionated*: if none of the rules existed or if i wanted to use a completely different data validation function, I could not use it. ( ? is this really a reason? ) `react-fields` has default validators, but allows your to completely swap out the existing validation in one place.
- *The submit lifecycle was too unopinionated*: most of the libraries would cover up to the submit part of the lifecycle at which it would jsut accept a callback and be done, but never beyond. They would If the server fails, or if there is a API side validation error, were not considered cases. or the loading state of the submit button. `react-fields` fully supports the different cases that happen after submit, including mapping api validation errors back to the fields they relate to, handling what happens after success.

`react-fields` was designed to not only address these deficiencies, but to also make building forms as quick and bug-free as possible.

- If you are looking for comprehensive documentation of the actual API, check out the [API docs](api.md). This manual is more of an explanatory catalog of features.
- If you just want to start looking at some code, start with the [#basics]().

# Concepts

`react-fields` has a few central concepts:

#### Form state as a single value

In `react-fields`, every form has an internal state that conforms to a defined schema. The entire form state, no matter how complex it is or how many nested forms it may contain, is reduced into one immutable value.

Both the form state and the structure of the validation errors map directly to this defined schema. This allows child components to introspectively know the structure of the data that is should be changing.

#### Layers of responsibility

Much of React's success is due to its active encouragement of decoupling and modularity by passing data from parent to child through documented `props`.

The interesting thing about forms is that they have to perform the inverse: collect data at an input component level and combine that data with other fields to compose the form data in the parent. Complex forms often fall apart because, unlike `propTypes`, there is no real defintion of the (is not enough safety) no enforced standard for passing data upward. `react-fields` tries to alleviate? this by constraining the form state to a schema.

In order to aggregate data from the child to the parent, `react-fields` recognizes the following non-intersecting levels of responsibility:

- *Field Component*: This is a React component that is responsible for displaying and changing a value. All field components have the `value` and `onChange` props.
- `Fields`: A component that is a collection of Field Components. `Fields` is a component that can accept `value/onChange`, Fields is a component that accepts the default value as `value` and emits the changes to that data through `onChange`. thus `Fields` is also a `Field`, you can compose fields together. *It should only describe the layout of one or more fields.
- `Form`: A component that wraps `Fields` and provides additional function like handling the submit lifecycle, validation, and passing error to the fields. Connects `Fields` to data layer on submit. Several callbacks to transform the data. Validation is also controlled here. controls the submit, validation, client and server errors. displays and listens to the submit button. It should only handle listening for a submit, sending the data to a persistence layer, and parsing any errors.
- *Persistence Layer*: gets an initial value and a changed value and is in charge of sending form data to the server and parsing and converting any errors that come back from the server into react-fields error format. Interacts with the backend or the server. there are some for redux and graphql.

#### Reduction of boilerplate

- includes factory methods to provision the form with a preset configuration.(- `createFormRenderer` `createFieldsRenderer`)
- utilities to move field presentation into the schema. If used correctly, this eliminates boilerplate in places where many fields are rendered. schema level presentation. fieldComponents and fields types. Helpful for situations with a lot of fields, with small enough difference. See the (accounting example) for boilerplate elimination. TODO: give an example of where you would actually use this information.

#### Sensible defaults

Although `react-fields` was made for complex situations, it is still easy to use in a brand new project while allowing you to slowly and painlessly add additional configuration in the future.

There are:

- default validators and error messages for each as well [link]
- form error is provided by defalt [link]

# Basics

These are the parts used in `react-fields`:

#### Schema

The schema is the shape of the form state.

```js
{
firstName: {
type: PropTypes.string,
rules: {
required: true
}
},
lastName: {
type: PropTypes.string,
rules: {
required: true
}
}
}
```

data presence helps for validation
validation is also included here
[add an option to type-check the fields on input, making sure that no outside fields are entered, typecheck with proptypes, these checks will produce actual runtime warnings instead of just validation errors.]

The schema can also contain presentation-specific options to cut down on boilerplate.

#### Field Component

A field component is any component that accepts the `value` and `onChange` props. Lots of existing ReactDOM components like `input` are already valid field components.

`react-fields` will also pass some additional props to fields compoenents that can help with ()[Validation] or presenting validation errors.

- `error`
- `schema`: the schema of the data that the field component is mutating

#### Fields

`Fields` us a component that combines the state of one or more field components.

```
import { Fields } from 'react-fields'

const schema = {
  firstName: PropTypes.string,
  lastName: PropTypes.string.isRequired
}

const render = (propsFor) => (
  <div>
    <input {...propsFor('firstName')} />
    <input {...propsFor('lastName')} />
  </div>
)

const defaultValue = {
  firstName: 'John', lastName: 'Doe'
}

const fields = (
  <Fields
    schema={schema}
    render={render}
    value={defaultValue}
    onChange={user => console.log('new user data:', user)}
  />
)

ReactDOM.render(fields, document.body)
```

`propsFor` is a function belonging to the render context. the render context contains other [helpers](TODO: link) as well.

Notice the `value` and `onChange` props on `Fields`. One of the more important parts of `react-fields` is that `Fields` is itself a **field component**. This allows nested groups with reusable groups of fields.

// TODO: show example with multiple fields components that are mounted

`Fields` uses the given schema to prevent bugs by throwing runtime warnings if illegal data is entered.
(``` Typing in the text box will cause a warning since the age field with type number was set with a ```) and unknown field. these only show up in development.

TODO: show the type errors on illegal data

Although using `schema` is highly recommended to prevent unneeded bugs from appearing, you can always quickly define `Fields` without one by using `noSchema`.

```
renderFields({
  noSchema: true
})
```

A `renderFields` helper is included for convenience to define form components: with stateless

`renderFields(schema, props, render)`

```jsx
import { renderFields } from 'react-fields'

// TODO: add schema
export const UserForm = props => renderFields({
  firstName: { type: PropTypes.string },
  lastName: { type: PropTypes.string }
}, {
  value: { firstName: 'John', lastName: 'Doe' },
  onChange: user => console.log('new user values:', user),
}, ({ propsFor }) => (
  <div>
    <input {...propsFor('firstName')} />
    <input {...propsFor(lastName')} />
  </div>
))

// This just returns a `Fields` component.
```

If you can't use splats for `propsFor`, there is a `renderField` method that is defined automatically.

// TODO: show an example of `renderField` (previously `render`)

Another important thing to notice is that `Fields` does not render any submit button or form-level error messages. `Fields` is only supposed to describe the layout of one or more fields, and automatically manages the value of the field components.

#### Form

`Form` is a component that wraps `Fields` and:

- handles submitting the data
- performs validation
- displays validation or submission errors if they exist

You can think of it as the layer between the fields and the persistence layer.

Declared just like `Fields`, only with some new props.

```
import { Form } from 'react-fields'

const schema = {
  firstName: {
    type: PropTypes.string,
    rules: {
      required: true
    }
  },
  lastName: {
    type: PropTypes.string,
    rules: {
      required: true
    }
  }
}

const render = ({ propsFor, isSubmitting }) => (
  <div>
    <input {...propsFor('firstName')} />
    <input {...propsFor(lastName')} />
    <button type="Submit">
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </button>
  </div>
)

const defaultValue = {
  firstName: 'John', lastName: 'Doe'
}

const form = (
  <Form
    schema={schema}
    render={render}
    value={defaultValue}
    onChange={user => console.log('new user data:', user)}
    onSubmit={user => console.log('submitted', user)}
    afterSubmit={() => console.log('navigate to the next page')}
  />
)

ReactDOM.render(form, document.body)
```

Like `renderFields` for `Fields`, there is also a `renderForm` that behaves like `renderFields`. It takes in the same argumest as `renderFields`.

TODO: include example for `renderForm`

##### Submitting

`Forms` wraps the defined fields with a `form` with its `onSubmit` linked to the submission of the form. This way, any `button` with `type` = `submit` will submit the form automatically.

However, if you want something else to trigger the submit, the `submit` function will be passed down through the render context for free use.

// TODO: show example with custom submit and isSubmitting

Once the form is submitted, there is a series of events that take place.

1. `submit` is called, by a the callback, the form, or whatever. it's async, so you can talk to the api
2. `validate` the current form data is validated.
3. `onSubmit` if pass, submit is called with the data, async. this is were you can upload the data to the datastore.
4. `afterSubmit`: if defined, will be executed with the same data for convenience...

##### Validation

Validation data is stored on the schema, and a corresponding validator is included by default.

Show the default validators.

[link to advanced custom validation]
// TODO: show example with the custom validate prop.

##### Errors

TODO: describe the validation error props that is passed to fields.
- validation errors (summary)
- validation errors passed to fields
If `submit` talks to a perishable service, you will want to capture any errors and let the user know what happened.

by default, the error will be show with `props.showError` but it is also exposed in `renderContext.error`. Use props.showFormError = false to do this.

**Only show flat stuff here.**

#### Persistence Backends

The persistence layer is responsible for persisting the form's submitted data remotely and/or locally. It is also responsible for return an appropriate error on failure, or server validation errors.

 This layer should be responsible for sending HTTP requests.

Some builtin backends.

##### Redux

'react-fields/utils/redux'

The form values are stored in component state by default. Since both `Fields` and `Form` have the `value` and `onChange` props, you can use external state management like Redux instead of local state. `react-fields` comes with [`bindRedux`](link to the API), a helper method that will let you do this automatically. Although `react-fields` uses local component state by default,

```

example

```

##### Relay

The included relay utility has a `commitMutation` that handles sending the data and intercepting the error automatically.

```
import { commitMutation } from 'react-fields/utils/relay'

class Mutation extends Relay.Mutation {

}


commitMutation(Mutation)
```

# Advanced

Although `react-fields` performs well in simple situations, it really shines in the complex ones. (? replace)

#### Nesting

describe nested forms and validation data. The most powerful feature or react-fields, allows modeling tables of data with dynamically added rows while still keeping to the principal that everything is a value.

##### Composing nested fields

- use fields in different contexts
- show an example with a list of objects

##### Error structure

#### Custom Validators

If the react-field's validation does not work well for the use case, you can [swap it out with your own.] create your own validator by extending the old one with new rules, or just start from scratch. `validate` prop: it only needs to take in `validate(data, schema) => null | formErrors | Promise<null | formErrors>`

swap in a different validator method

#### Render Context

- hide fields when they are invalid
- show the different things inside rendercontext

#### Reducing Boilerplate

Several methods are included to reduce the amount of boilerplate it takes to build forms.

##### options

- create{Field,Form}Renderer
- createFieldsComponent

##### presentation in the schema

- render
- fieldComponent
- fieldComponentProps
- readOnly through global fieldComponentProps

#### Custom persistence backends

# Examples

# FAQ

# API Reference (gitbooks)

# Change log (gitbooks)

# Feedback
