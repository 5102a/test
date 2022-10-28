import { Priority } from './const'

export const getEventTime = () => {
  return performance.now()
}

export const getEventPriority = (domEventName) => {
  switch (domEventName) {
    case 'click':
      return Priority.DiscreteEventPriority

    case 'mousemove':
      return Priority.ContinuousEventPriority

    case 'message': {
      // We might be in the Scheduler callback.
      // Eventually this mechanism will be replaced by a check
      // of the current priority on the native scheduler.
      var schedulerPriority = getCurrentPriorityLevel()

      switch (schedulerPriority) {
        case ImmediatePriority:
          return Priority.DiscreteEventPriority

        case UserBlockingPriority:
          return Priority.ContinuousEventPriority

        case NormalPriority:
        case LowPriority:
          // TODO: Handle LowSchedulerPriority, somehow. Maybe the same lane as hydration.
          return Priority.DefaultEventPriority

        case IdlePriority:
          return Priority.IdleEventPriority

        default:
          return Priority.DefaultEventPriority
      }
    }

    default:
      return Priority.DefaultEventPriority
  }
}

export function mergeLanes(a, b) {
  return a | b
}

const log = Math.log
const LN2 = Math.LN2

function clz32Fallback(x) {
  var asUint = x >>> 0

  if (asUint === 0) {
    return 32
  }

  return (31 - ((log(asUint) / LN2) | 0)) | 0
}

const clz32 = Math.clz32 ? Math.clz32 : clz32Fallback

export function pickArbitraryLaneIndex(lanes) {
  return 31 - clz32(lanes)
}


