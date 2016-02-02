import React from 'react'

const TextInput = props => (
  <input
    {...props}
    onChange={event => props.onChange(event.target.value)}
  />
)

export default TextInput
