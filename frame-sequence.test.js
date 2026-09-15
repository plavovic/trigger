const test = require('node:test');
const assert = require('node:assert/strict');

const { FRAME_COUNT, FRAME_DIRECTORY, getFramePath } = require('./lib/frameSequence');

test('frame sequence uses the exported frame naming contract', () => {
  assert.equal(FRAME_COUNT, 300);
  assert.equal(FRAME_DIRECTORY, '/frames');
  assert.equal(getFramePath(0), '/frames/ezgif-frame-001.png');
  assert.equal(getFramePath(299), '/frames/ezgif-frame-300.png');
});
