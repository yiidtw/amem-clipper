import { describe, it, expect } from 'vitest';
import { createFsm } from '../../extension/lib/fsm.mjs';

describe('createFsm', () => {
  const transitions = {
    idle: { start: 'recording' },
    recording: { stop: 'idle' },
  };

  it('starts in the initial state', () => {
    const fsm = createFsm('idle', transitions);
    expect(fsm.state).toBe('idle');
  });

  it('transitions on a valid event', () => {
    const fsm = createFsm('idle', transitions);
    fsm.send('start');
    expect(fsm.state).toBe('recording');
    fsm.send('stop');
    expect(fsm.state).toBe('idle');
  });

  it('throws on an invalid transition', () => {
    const fsm = createFsm('idle', transitions);
    expect(() => fsm.send('stop')).toThrow();
  });

  it('notifies subscribers', () => {
    const fsm = createFsm('idle', transitions);
    const events = [];
    fsm.subscribe((ev) => events.push(ev));
    fsm.send('start', { foo: 1 });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ prev: 'idle', next: 'recording', event: 'start', payload: { foo: 1 } });
  });
});
