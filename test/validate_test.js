import validate, { rules } from '../lib/validate'
import expect from 'expect'

const testRule = (ruleName, value, param, expectedMessage) => {
  const message = rules[ruleName]({ title: 'value', value, param })
  expect(message).toBe(expectedMessage || false)
}

describe('rules', () => {

  it('should validate `required`', () => {
    testRule('required', null, false)
    testRule('required', null, true, 'value is required')
    testRule('required', undefined, true, 'value is required')
    testRule('required', '', true, 'value is required')
    testRule('required', 0, true)
    testRule('required', 1, true)
    testRule('required', 'string', true)
  })

  it('should validate `min`', () => {
    testRule('min', 0, 1, 'value must not be less than 1')
    testRule('min', 1, 1)
    testRule('min', 1, 0)
  })

  it('should validate `max`', () => {
    testRule('max', 1, 0, 'value must not be more than 1')
    testRule('max', 1, 1)
    testRule('max', 0, 1)
  })

  it('should validate `minLength`', () => {
    testRule('minLength', '', 1, 'value must have at least 1 character')
    testRule('minLength', 'f', 2, 'value must have at least 2 characters')
    testRule('minLength', 'fo', 2)
    testRule('minLength', 'foo', 2)

    testRule('minLength', [], 1, 'value must have at least 1 item')
    testRule('minLength', [1], 2, 'value must have at least 2 items')
    testRule('minLength', [1, 1], 2)
    testRule('minLength', [1, 1, 1], 2)
  })

  it('should validate `maxLength`', () => {

    testRule('maxLength', 'foo', 2, 'value must not have more than 2 characters')
    testRule('maxLength', 'fo', 1, 'value must not have more than 1 character')
    testRule('maxLength', 'f', 1)
    testRule('maxLength', '', 1)

    testRule('maxLength', [1, 1, 1], 2, 'value must not have more than 2 items')
    testRule('maxLength', [1, 1], 1, 'value must not have more than 1 item')
    testRule('maxLength', [1], 1)
    testRule('maxLength', [], 1)

  })

  it('should validate `match`', () => {
    const pattern = /foo/
    testRule('match', 'foo', pattern)
    testRule('match', 'bar', pattern, 'value does not match pattern /foo/')
  })
})

describe('validate', () => {

  context('when root is a value', () => {

    it('returns the correct value', async () => {
      const schema = {
        type: 'string',
        rules: {
          required: true
        }
      }

      expect(await validate(schema, 'foo')).toEqual(null)
      expect(await validate(schema, null)).toEqual({
        error: 'root string is required',
        formError: undefined
      })
    })
  })

  context('when root is an array', () => {

    it('returns the correct value', async () => {
      const schema = {
        type: 'array',
        rules: {
          minLength: 1
        },
        schema: {
          type: 'string'
        }
      }

      expect(await validate(schema, ['foo'])).toEqual(null)
      expect(await validate(schema, [])).toEqual({
        error: {
          error: 'root array must have at least 1 item'
        },
        formError: undefined
      })
    })
  })

  context('when root is an object', () => {

    it('returns the correct value', async () => {
      const schema = {
        type: 'object',
        rules: {
          required: true
        },
        schema: {
          foo: {
            type: 'string',
            rules: {
              required: true
            }
          },
          bar: {
            type: 'string',
            rules: {
              required: true
            }
          }
        }
      }

      expect(await validate(schema, null)).toEqual({
        error: {
          error: 'root object is required',
          fieldErrors: {
            foo: 'Foo is required',
            bar: 'Bar is required'
          }
        },
        formError: undefined
      })

      expect(await validate(schema, {})).toEqual({
        error: {
          error: undefined,
          fieldErrors: {
            foo: 'Foo is required',
            bar: 'Bar is required'
          }
        },
        formError: undefined
      })
    })
  })
})

/*
TODO:

- custom error message (string and function)
- lifted formError
- titles
- custom errors (sync and async)
*/
