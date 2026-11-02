// Bound whole preview loads so browser-queued requests do not expire together.
export function createLoadQueue(limit = 6) {
  let active = 0, closed = false;
  const pending = [];
  function drain() {
    while (!closed && active < limit && pending.length) {
      const { task, resolve, reject } = pending.shift(); active++;
      Promise.resolve().then(task).then(resolve, reject).finally(() => { active--; drain(); });
    }
  }
  return {
    add(task) {
      if (closed) return Promise.resolve(null);
      return new Promise((resolve, reject) => { pending.push({ task, resolve, reject }); drain(); });
    },
    close() { closed = true; pending.splice(0).forEach(({ resolve }) => resolve(null)); },
  };
}
