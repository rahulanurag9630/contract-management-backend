const VALID_TRANSITIONS = {
  Draft: ['Active'],
  Active: ['Executed', 'Expired'],
  Executed: [],
  Expired: [],
}

export function isValidTransition(from, to) {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getValidNextStatuses(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] ?? []
}

export function isTerminalStatus(status) {
  return VALID_TRANSITIONS[status]?.length === 0
}
