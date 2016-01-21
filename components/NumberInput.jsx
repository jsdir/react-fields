import React from 'react'

const NumberInput = props => (
  <input
    type="number"
    {...props}
    onChange={event => props.onChange(parseInt(event.target.value))}
  />
)

export default NumberInput
