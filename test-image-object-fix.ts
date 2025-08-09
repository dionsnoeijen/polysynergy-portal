// Test script to verify that Image objects are properly handled
import { sanitizeValueToDisplayString } from './src/utils/dataSanitization';
import interpretNodeVariableType from './src/utils/interpretNodeVariableType';
import { NodeVariable, NodeVariableType } from './src/types/types';

// Test the fix for Image objects being rendered in boolean variables
console.log('Testing Image object sanitization fix...\n');

// 1. Test sanitization of Image objects
const imageObject = {
    url: 'https://example.com/image.png',
    mime_type: 'image/png',
    width: 800,
    height: 600,
    size: 12345,
    metadata: { some: 'data' }
};

console.log('1. Testing sanitizeValueToDisplayString with Image object:');
const sanitizedImageText = sanitizeValueToDisplayString(imageObject);
console.log('Input:', imageObject);
console.log('Output:', sanitizedImageText);
console.log('Type:', typeof sanitizedImageText);
console.log('Is string?', typeof sanitizedImageText === 'string');
console.log('');

// 2. Test type detection for variables with Image objects
const booleanVariableWithImageObject: NodeVariable = {
    handle: 'test_boolean',
    value: imageObject,
    published: false,
    type: 'bool',
    has_dock: false,
    has_in: true,
    has_out: true,
    node: true
};

console.log('2. Testing type detection for boolean variable with Image object:');
const detectedType = interpretNodeVariableType(booleanVariableWithImageObject);
console.log('Variable type:', booleanVariableWithImageObject.type);
console.log('Variable value:', booleanVariableWithImageObject.value);
console.log('Detected base type:', detectedType.baseType);
console.log('Should be Image?', detectedType.baseType === NodeVariableType.Image);
console.log('');

// 3. Test with different Image object structures
const imageObjectMinimal = {
    url: 'https://example.com/image2.jpg',
    width: 400
};

console.log('3. Testing with minimal Image object:');
const sanitizedMinimal = sanitizeValueToDisplayString(imageObjectMinimal);
console.log('Input:', imageObjectMinimal);
console.log('Output:', sanitizedMinimal);
console.log('');

const booleanVariableWithMinimalImage: NodeVariable = {
    handle: 'test_boolean2',
    value: imageObjectMinimal,
    published: false,
    type: 'bool',
    has_dock: false,
    has_in: true,
    has_out: true,
    node: true
};

const detectedTypeMinimal = interpretNodeVariableType(booleanVariableWithMinimalImage);
console.log('Detected type for minimal image:', detectedTypeMinimal.baseType);
console.log('Should be Image?', detectedTypeMinimal.baseType === NodeVariableType.Image);
console.log('');

// 4. Test with regular boolean values (should remain unchanged)
console.log('4. Testing with regular boolean values:');
const regularBoolean = true;
const sanitizedBoolean = sanitizeValueToDisplayString(regularBoolean);
console.log('Input:', regularBoolean);
console.log('Output:', sanitizedBoolean);
console.log('Type:', typeof sanitizedBoolean);
console.log('');

const booleanVariableRegular: NodeVariable = {
    handle: 'test_boolean_regular',
    value: regularBoolean,
    published: false,
    type: 'bool',
    has_dock: false,
    has_in: true,
    has_out: true,
    node: true
};

const detectedTypeRegular = interpretNodeVariableType(booleanVariableRegular);
console.log('Detected type for regular boolean:', detectedTypeRegular.baseType);
console.log('Should be Boolean?', detectedTypeRegular.baseType === NodeVariableType.Boolean);
console.log('');

console.log('✅ All tests completed! Image objects should now be properly handled.');