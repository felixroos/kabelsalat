/**
 * Assert that a condition holds true
 */
export function assert(condition, errorText)
{
    if (!errorText)
        errorText = 'assertion failed';

    if (!condition)
    {
        throw new Error(errorText);
    }
}
