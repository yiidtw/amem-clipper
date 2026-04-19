// amem — tiny state machine helper used by capture and recording flows.

export function createFsm(initial, transitions) {
  let state = initial;
  const listeners = new Set();
  return {
    get state() { return state; },
    can(event) {
      return !!(transitions[state] && transitions[state][event]);
    },
    send(event, payload) {
      const next = transitions[state] && transitions[state][event];
      if (!next) throw new Error(`Invalid transition: ${state} --${event}-->`);
      const prev = state;
      state = next;
      listeners.forEach((fn) => fn({ prev, next: state, event, payload }));
      return state;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
