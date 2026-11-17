const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initialState, reducer, restore } = require('../.test-build/model.js');
const { getPetState, petStates, petAnimations } = require('../.test-build/pet.js');

test('every callable state has an animation placeholder', () => {
  for (const value of petStates) {
    const state = reducer(initialState(), { type: 'PET_STATE', value });
    assert.equal(getPetState(state), value);
    assert.equal(petAnimations[value].placeholderPose, value);
    assert.equal(petAnimations[value].asset, null);
  }
});

test('manual states do not spend food or award points; reset follows automatic state', () => {
  let state = initialState();
  assert.equal(getPetState(state), 'awake');
  state = reducer(state, { type: 'PET_STATE', value: 'fed' });
  assert.equal(state.fed, false);
  assert.equal(state.food, 0);
  assert.equal(state.points, 20);
  state = reducer(state, { type: 'PET_STATE', value: null });
  assert.equal(getPetState(state), 'awake');
  assert.equal(reducer(state, { type: 'PET_STATE', value: 'invalid' }), state);
});

test('feeding updates pet only on confirmed success and cannot spend twice', () => {
  let state = reducer(initialState(), { type: 'BUY' });
  state = reducer(state, { type: 'PET_STATE', value: 'sleep' });
  state = reducer(state, { type: 'FEED' });
  assert.equal(getPetState(state), 'fed');
  assert.equal(state.food, 0);
  assert.equal(reducer(state, { type: 'FEED' }), state);
});

test('offline feeding stays unconfirmed until sync', () => {
  let state = reducer(initialState(), { type: 'BUY' });
  state = reducer(state, { type: 'OFFLINE', value: true });
  state = reducer(state, { type: 'FEED' });
  assert.equal(getPetState(state), 'awake');
  assert.equal(state.pending, true);
  assert.equal(state.food, 1);
  state = reducer(state, { type: 'SYNC' });
  assert.equal(getPetState(state), 'fed');
  assert.equal(state.pending, false);
  assert.equal(state.food, 0);
});

test('challenge supports sleep, shake, awake, happy, completion and stop', () => {
  let state = initialState();
  state = reducer(state, { type: 'SAVE', settings: { ...state.settings, duration: 15 } });
  state = reducer(state, { type: 'START' });
  assert.equal(getPetState(state), 'sleep');
  state = reducer(state, { type: 'PET_STATE', value: 'shake' });
  state = reducer(state, { type: 'TICK', gain: true });
  assert.equal(getPetState(state), 'shake');
  state = reducer(state, { type: 'PET_STATE', value: null });
  assert.equal(getPetState(state), 'awake');
  for (let i = 1; i < 10; i++) state = reducer(state, { type: 'TICK', gain: true });
  assert.equal(getPetState(state), 'happy');
  state = reducer(state, { type: 'PET_STATE', value: 'shake' });
  for (let i = 10; i < 15; i++) state = reducer(state, { type: 'TICK', gain: true });
  assert.equal(getPetState(state), 'happy');
  assert.equal(state.active, false);
  assert.equal(state.points, 30);
  state = reducer(state, { type: 'START' });
  state = reducer(state, { type: 'PET_STATE', value: 'shake' });
  state = reducer(state, { type: 'STOP' });
  assert.equal(state.petOverride, null);
  assert.equal(state.active, false);
  assert.equal(getPetState(state), 'happy');
});

test('failed actions preserve state and reset clears previews', () => {
  const state = reducer(initialState(), { type: 'PET_STATE', value: 'sleep' });
  for (const type of ['START', 'FEED', 'SYNC', 'TICK']) {
    assert.equal(reducer(state, { type, gain: true }), state);
  }
  assert.deepEqual(reducer(state, { type: 'RESET' }), initialState());
});

test('reload restores saved records without transient animation or gestures', () => {
  const oldRecord = initialState();
  delete oldRecord.petOverride;
  assert.equal(getPetState(restore(JSON.stringify(oldRecord))), 'awake');
  let state = reducer(initialState(), { type: 'BUY' });
  state = reducer(state, { type: 'FEED' });
  state = reducer(state, { type: 'PET_STATE', value: 'shake' });
  assert.equal(getPetState(restore(JSON.stringify(state))), 'fed');
  state = reducer(state, { type: 'SAVE', settings: state.settings });
  state = reducer(state, { type: 'START' });
  state = reducer(state, { type: 'PET_STATE', value: 'shake' });
  const restored = restore(JSON.stringify(state));
  assert.equal(restored.active, false);
  assert.equal(restored.petOverride, null);
  assert.equal(getPetState(restored), 'fed');
});
