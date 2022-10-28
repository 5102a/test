import {
  Context,
  LanesType,
  LaneType,
  Mode,
  NodeTag,
  Priority,
  RootStatus,
  RootTag,
  State,
} from './const'
import {
  getEventPriority,
  getEventTime,
  mergeLanes,
  pickArbitraryLaneIndex,
} from './utils'

let executionContext = Context.NoContext
let currentUpdatePriority = LaneType.NoLane
let concurrentQueues: SharedQueue[] | null = null
let NoTimestamp = -1

const workInProgressGlobalInfo = {
  workInProgressRootExitStatus: RootStatus.RootInProgress,
  workInProgressRootInterleavedUpdatedLanes: LanesType.NoLanes,
  workInProgressRootRenderLanes: LanesType.NoLanes,
  workInProgressRootPingedLanes: LanesType.NoLanes,
  workInProgressRootFatalError: null,
  workInProgressRoot: null,
  workInProgress: null,
}

class Update {
  eventTime: number
  lane: number
  tag: State
  payload = null
  callback = null
  next: Update | null = null
  constructor(props) {
    const { eventTime, lane, tag, payload, callback, next } = props
    this.eventTime = eventTime
    this.lane = lane
    this.tag = tag
    this.payload = payload
    this.callback = callback
    this.next = next
  }
}

class SharedQueue {
  interleaved: Update
}

class UpdateQueue {
  shared: SharedQueue
}

class Node {
  tag: NodeTag
  mode: Mode
  updateQueue: UpdateQueue
  lanes: number
  alternate: Node
  return: Node
  childLanes: number
  stateNode: Root
  constructor() {}
}

class Root {
  current: Node
  tag: RootTag
  pendingLanes: number
  suspendedLanes: number
  pingedLanes: number
  expiredLanes: number
  eventTimes: number[]
  expirationTimes: number[]
  callbackNode: null
  entangledLanes: number
  entanglements: []
  callbackPriority: number
  finishedWork: Node
  finishedLanes: number
  constructor() {}
}

const createUpdate = (eventTime, lane: LaneType | Priority) => {
  const update = {
    eventTime: eventTime,
    lane: lane,
    tag: State.UpdateState,
    payload: null,
    callback: null,
    next: null,
  }
  return update
}

function pushConcurrentUpdateQueue(queue: SharedQueue) {
  if (concurrentQueues === null) {
    concurrentQueues = [queue]
  } else {
    concurrentQueues.push(queue)
  }
}

const getCurrentUpdatePriority = () => {
  return currentUpdatePriority
}

function getCurrentEventPriority() {
  var currentEvent = window.event

  if (currentEvent === undefined) {
    return Priority.DefaultEventPriority
  }

  return getEventPriority(currentEvent.type)
}

const requestUpdateLane = (node: Node) => {
  const mode = node.mode
  if ((mode & Mode.ConcurrentMode) === Mode.NoMode) {
    return LaneType.SyncLane
  } else if (
    (executionContext & Context.RenderContext) !== Context.NoContext &&
    workInProgressGlobalInfo.workInProgressRootRenderLanes !== LanesType.NoLanes
  ) {
    // 这是渲染阶段更新，相同lane
    return LaneType.DefaultLane
  }

  const updateLane = getCurrentUpdatePriority()

  if (updateLane !== LaneType.NoLane) {
    return updateLane
  }

  var eventLane = getCurrentEventPriority()
  return eventLane
}

const markUpdateLaneFromFiberToRoot = (node: Node, lane) => {
  node.lanes = mergeLanes(node.lanes, lane)
  let alternate = node.alternate
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane)
  }

  let curNode = node
  let parent = node.return

  while (parent !== null) {
    parent.childLanes = mergeLanes(parent.childLanes, lane)
    alternate = parent.alternate

    if (alternate !== null) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane)
    } else {
    }

    curNode = parent
    parent = parent.return
  }

  if (curNode.tag === NodeTag.HostRoot) {
    var root = curNode.stateNode
    return root
  } else {
    return null
  }
}

const enqueueConcurrentClassUpdate = (
  node: Node,
  sharedQueue: SharedQueue,
  update: Update,
  lane
) => {
  const interleaved = sharedQueue.interleaved
  if (interleaved === null) {
    update.next = update
    pushConcurrentUpdateQueue(sharedQueue)
  } else {
    update.next = interleaved.next
    interleaved.next = update
  }

  sharedQueue.interleaved = update
  return markUpdateLaneFromFiberToRoot(node, lane)
}

const enqueueUpdate = (node: Node, update: Update, lane) => {
  const updateQueue = node.updateQueue

  if (updateQueue === null) {
    return null
  }

  const sharedQueue = updateQueue.shared

  return enqueueConcurrentClassUpdate(node, sharedQueue, update, lane)
}

const start = (element, root: Root, parentComponent, callback) => {
  const node = root.current
  const eventTime = getEventTime()
  const lane = requestUpdateLane(node)

  const update = createUpdate(eventTime, lane)
  update.payload = {
    element: element,
  }

  if (callback !== undefined) {
    update.callback = callback ? callback : null
  }

  const rootNode = enqueueUpdate(node, update, lane)

  if (rootNode !== null) {
    scheduleUpdateOnFiber(rootNode, node, lane, eventTime)
  }

  return lane
}

function laneToIndex(lane) {
  return pickArbitraryLaneIndex(lane)
}

const markRootUpdated = (root: Root, updateLane, eventTime) => {
  root.pendingLanes |= updateLane // If there are any suspended transitions, it's possible this new update
  if (updateLane !== LaneType.IdleLane) {
    root.suspendedLanes = LanesType.NoLanes
    root.pingedLanes = LanesType.NoLanes
  }

  var eventTimes = root.eventTimes
  var index = laneToIndex(updateLane) // We can always overwrite an existing timestamp because we prefer the most
  // recent event, and we assume time is monotonically increasing.

  eventTimes[index] = eventTime
}

const scheduleUpdateOnFiber = (root: Root, node: Node, lane, eventTime) => {
  markRootUpdated(root, lane, eventTime)
  if (
    (executionContext & Context.RenderContext) !== LanesType.NoLanes &&
    root === workInProgressGlobalInfo.workInProgressRoot
  ) {
    // warning
  } else {
    if (root === workInProgressGlobalInfo.workInProgressRoot) {
      //
    }

    ensureRootIsScheduled(root, eventTime)
  }
}

function computeExpirationTime(lane, currentTime) {
  switch (lane) {
    case LaneType.SyncLane:
    case LaneType.InputContinuousLane:
      return currentTime + 250
    case LaneType.DefaultLane:
      return currentTime + 5000
    // case LaneType.RetryLane1:
    //   return NoTimestamp
    case LaneType.IdleLane:
      return NoTimestamp
    default:
      return NoTimestamp
  }
}

function markStarvedLanesAsExpired(root: Root, currentTime) {
  const pendingLanes = root.pendingLanes
  const suspendedLanes = root.suspendedLanes
  const pingedLanes = root.pingedLanes
  const expirationTimes = root.expirationTimes
  let lanes = pendingLanes

  while (lanes > 0) {
    const index = pickArbitraryLaneIndex(lanes)
    const lane = 1 << index
    const expirationTime = expirationTimes[index]

    if (expirationTime === NoTimestamp) {
      if (
        (lane & suspendedLanes) === LanesType.NoLanes ||
        (lane & pingedLanes) !== LanesType.NoLanes
      ) {
        expirationTimes[index] = computeExpirationTime(lane, currentTime)
      }
    } else if (expirationTime <= currentTime) {
      root.expiredLanes |= lane
    }

    lanes &= ~lane
  }
}

function getHighestPriorityLane(lanes) {
  return lanes & -lanes
}

function getHighestPriorityLanes(lanes) {
  switch (getHighestPriorityLane(lanes)) {
    case LaneType.SyncLane:
      return LaneType.SyncLane

    case LaneType.InputContinuousLane:
      return LaneType.InputContinuousLane

    case LaneType.DefaultLane:
      return LaneType.DefaultLane

    case LaneType.IdleLane:
      return LaneType.IdleLane

    // case LaneType.OffscreenLane:
    //   return LaneType.OffscreenLane

    default:
      return lanes
  }
}

function getNextLanes(root: Root, wipLanes) {
  var pendingLanes = root.pendingLanes

  if (pendingLanes === LanesType.NoLanes) {
    return LanesType.NoLanes
  }

  const NoLanes = LanesType.NoLanes

  var nextLanes = NoLanes
  var suspendedLanes = root.suspendedLanes
  var pingedLanes = root.pingedLanes

  var nonIdlePendingLanes = pendingLanes & LanesType.NonIdleLanes

  if (nonIdlePendingLanes !== NoLanes) {
    var nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes

    if (nonIdleUnblockedLanes !== NoLanes) {
      nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes)
    } else {
      var nonIdlePingedLanes = nonIdlePendingLanes & pingedLanes

      if (nonIdlePingedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(nonIdlePingedLanes)
      }
    }
  } else {
    var unblockedLanes = pendingLanes & ~suspendedLanes

    if (unblockedLanes !== NoLanes) {
      nextLanes = getHighestPriorityLanes(unblockedLanes)
    } else {
      if (pingedLanes !== NoLanes) {
        nextLanes = getHighestPriorityLanes(pingedLanes)
      }
    }
  }

  if (nextLanes === NoLanes) {
    return NoLanes
  }

  if (
    wipLanes !== NoLanes &&
    wipLanes !== nextLanes &&
    (wipLanes & suspendedLanes) === NoLanes
  ) {
    var nextLane = getHighestPriorityLane(nextLanes)
    var wipLane = getHighestPriorityLane(wipLanes)

    if (nextLane >= wipLane || nextLane === LaneType.DefaultLane) {
      return wipLanes
    }
  }

  if ((nextLanes & LaneType.InputContinuousLane) !== NoLanes) {
    nextLanes |= pendingLanes & LaneType.DefaultLane
  }
  var entangledLanes = root.entangledLanes

  if (entangledLanes !== NoLanes) {
    var entanglements = root.entanglements
    var lanes = nextLanes & entangledLanes

    while (lanes > 0) {
      var index = pickArbitraryLaneIndex(lanes)
      var lane = 1 << index
      nextLanes |= entanglements[index]
      lanes &= ~lane
    }
  }

  return nextLanes
}

var fakeActCallbackNode = {}

function cancelCallback(callbackNode) {
  if (callbackNode === fakeActCallbackNode) {
    return
  }
  return Scheduler.unstable_cancelCallback(callbackNode)
}

function lanesToEventPriority(lanes) {
  var lane = getHighestPriorityLane(lanes)

  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority
  }

  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority
  }

  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority
  }

  return IdleEventPriority
}

const ensureRootIsScheduled = (root: Root, currentTime) => {
  const existingCallbackNode = root.callbackNode

  markStarvedLanesAsExpired(root, currentTime)

  const nextLanes = getNextLanes(
    root,
    root === workInProgressGlobalInfo.workInProgressRoot
      ? workInProgressGlobalInfo.workInProgressRootRenderLanes
      : LanesType.NoLanes
  )

  if (nextLanes === LanesType.NoLanes) {
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode)
    }

    root.callbackNode = null
    root.callbackPriority = LaneType.NoLane
    return
  }

  const newCallbackPriority = getHighestPriorityLane(nextLanes)
  const existingCallbackPriority = root.callbackPriority

  if (existingCallbackNode != null) {
    cancelCallback(existingCallbackNode)
  }

  var newCallbackNode

  if (newCallbackPriority === LaneType.SyncLane) {
    // if (root.tag === RootTag.LegacyRoot) {
    //   scheduleLegacySyncCallback(performSyncWorkOnRoot.bind(null, root))
    // } else {
    //   scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))
    // }

    newCallbackNode = null
  } else {
    let schedulerPriorityLevel

    switch (lanesToEventPriority(nextLanes)) {
      case Priority.DiscreteEventPriority:
        schedulerPriorityLevel = ImmediatePriority
        break

      case Priority.ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingPriority
        break

      case Priority.DefaultEventPriority:
        schedulerPriorityLevel = NormalPriority
        break

      case Priority.IdleEventPriority:
        schedulerPriorityLevel = IdlePriority
        break

      default:
        schedulerPriorityLevel = NormalPriority
        break
    }

    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    )
  }

  root.callbackPriority = newCallbackPriority
  root.callbackNode = newCallbackNode
}

function performConcurrentWorkOnRoot(root: Root, didTimeout) {
  currentEventTime = NoTimestamp

  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    throw new Error('Should not already be working.')
  }

  var originalCallbackNode = root.callbackNode
  // var didFlushPassiveEffects = flushPassiveEffects()

  // if (didFlushPassiveEffects) {
  //   if (root.callbackNode !== originalCallbackNode) {
  //     return null
  //   }
  // }

  var lanes = getNextLanes(
    root,
    root === workInProgressGlobalInfo.workInProgressRoot
      ? workInProgressGlobalInfo.workInProgressRootRenderLanes
      : LanesType.NoLanes
  )

  if (lanes === LanesType.NoLanes) {
    return null
  }
  var shouldTimeSlice =
    !includesBlockingLane(root, lanes) &&
    !includesExpiredLane(root, lanes) &&
    !didTimeout
  var exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes)

  if (exitStatus !== RootStatus.RootInProgress) {
    // if (exitStatus === RootErrored) {
    //   var errorRetryLanes = getLanesToRetrySynchronouslyOnError(root)

    //   if (errorRetryLanes !== LanesType.NoLanes) {
    //     lanes = errorRetryLanes
    //     exitStatus = recoverFromConcurrentError(root, errorRetryLanes)
    //   }
    // }

    // if (exitStatus === RootFatalErrored) {
    //   var fatalError = workInProgressRootFatalError
    //   prepareFreshStack(root, LanesType.NoLanes)
    //   markRootSuspended$1(root, lanes)
    //   ensureRootIsScheduled(root, now())
    //   throw fatalError
    // }

    if (exitStatus === RootDidNotComplete) {
      markRootSuspended$1(root, lanes)
    } else {
      var renderWasConcurrent = !includesBlockingLane(root, lanes)
      var finishedWork = root.current.alternate

      // if (
      //   renderWasConcurrent &&
      //   !isRenderConsistentWithExternalStores(finishedWork)
      // ) {
      //   exitStatus = renderRootSync(root, lanes)

      //   if (exitStatus === RootErrored) {
      //     var _errorRetryLanes = getLanesToRetrySynchronouslyOnError(root)

      //     if (_errorRetryLanes !== NoLanes) {
      //       lanes = _errorRetryLanes
      //       exitStatus = recoverFromConcurrentError(root, _errorRetryLanes) // We assume the tree is now consistent because we didn't yield to any
      //     }
      //   }

      //   if (exitStatus === RootFatalErrored) {
      //     var _fatalError = workInProgressRootFatalError
      //     prepareFreshStack(root, NoLanes)
      //     markRootSuspended$1(root, lanes)
      //     ensureRootIsScheduled(root, now())
      //     throw _fatalError
      //   }
      // }

      root.finishedWork = finishedWork
      root.finishedLanes = lanes
      // finishConcurrentRender(root, exitStatus, lanes)
    }
  }

  ensureRootIsScheduled(root, performance.now())

  if (root.callbackNode === originalCallbackNode) {
    return performConcurrentWorkOnRoot.bind(null, root)
  }

  return null
}
