const SyncLane = 0b0000000000000000000000000000001
const InputContinuousLane = 0b0000000000000000000000000000100
const DefaultLane = 0b0000000000000000000000000010000
const IdleLane = 0b0100000000000000000000000000000
const NoLane = 0b0000000000000000000000000000000

var DiscreteEventPriority = SyncLane
var ContinuousEventPriority = InputContinuousLane
var DefaultEventPriority = DefaultLane
var IdleEventPriority = IdleLane
var currentUpdatePriority = NoLane
// 从root.tag读取
var NoMode = 0
var ConcurrentMode = 1
var ProfileMode = 2
var StrictLegacyMode = 8
var StrictEffectsMode = 16

var UpdateState = 0
var ReplaceState = 1
var ForceUpdate = 2
var CaptureUpdate = 3

var FunctionComponent = 0
var ClassComponent = 1
var IndeterminateComponent = 2 // Before we know whether it is function or class

var HostRoot = 3 // Root of a host tree. Could be nested inside another node.

var HostPortal = 4 // A subtree. Could be an entry point to a different renderer.

var HostComponent = 5
var HostText = 6
var Fragment = 7
var Mode = 8
var ContextConsumer = 9
var ContextProvider = 10
var ForwardRef = 11
var Profiler = 12
var SuspenseComponent = 13
var MemoComponent = 14
var SimpleMemoComponent = 15
var LazyComponent = 16
var IncompleteClassComponent = 17
var DehydratedFragment = 18
var SuspenseListComponent = 19
var ScopeComponent = 21
var OffscreenComponent = 22
var LegacyHiddenComponent = 23
var CacheComponent = 24
var TracingMarkerComponent = 25

var TotalLanes = 31
var NoLanes = 0
var NoLane = 0
var SyncLane = 1
var InputContinuousHydrationLane = 2
var InputContinuousLane = 4
var DefaultHydrationLane = 8
var DefaultLane = 16
var TransitionHydrationLane = 32
var TransitionLanes = 4194240
var TransitionLane1 = 64
var TransitionLane2 = 128
var TransitionLane3 = 256
var TransitionLane4 = 512
var TransitionLane5 = 1024
var TransitionLane6 = 2048
var TransitionLane7 = 4096
var TransitionLane8 = 8192
var TransitionLane9 = 16384
var TransitionLane10 = 32768
var TransitionLane11 = 65536
var TransitionLane12 = 131072
var TransitionLane13 = 262144
var TransitionLane14 = 524288
var TransitionLane15 = 1048576
var TransitionLane16 = 2097152
var RetryLanes = 130023424
var RetryLane1 = 4194304
var RetryLane2 = 8388608
var RetryLane3 = 16777216
var RetryLane4 = 33554432
var RetryLane5 = 67108864
var SomeRetryLane = RetryLane1
var SelectiveHydrationLane = 134217728
var NonIdleLanes = 268435455
var IdleHydrationLane = 268435456
var IdleLane = 536870912
var OffscreenLane = 1073741824

var NoTimestamp = -1

let workInProgressRoot: FiberRootNode | null = null

var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback // Count leading zeros.

var log = Math.log
var LN2 = Math.LN2

function clz32Fallback(x) {
  var asUint = x >>> 0

  if (asUint === 0) {
    return 32
  }

  return (31 - ((log(asUint) / LN2) | 0)) | 0
}

var LegacyRoot = 0
var ConcurrentRoot = 1

var NoContext = 0
var BatchedContext = 1
var RenderContext = 2
var CommitContext = 4

var RootInProgress = 0
var RootFatalErrored = 1
var RootErrored = 2
var RootSuspended = 3
var RootSuspendedWithDelay = 4
var RootCompleted = 5
var RootDidNotComplete = 6

var workInProgressRootExitStatus = RootInProgress
var workInProgressRootInterleavedUpdatedLanes = NoLanes
var workInProgressRootRenderLanes = NoLanes
var workInProgressRootPingedLanes = NoLanes
var workInProgressRootFatalError = null
var workInProgress = null

var StoreConsistency = 16384

var executionContext = NoContext // The root we're working on

var currentEventTime = NoTimestamp

var syncQueue: Function[] | null = null

var scheduleMicrotask =
  typeof queueMicrotask === 'function'
    ? queueMicrotask
    : typeof localPromise !== 'undefined'
    ? function (callback) {
        return localPromise
          .resolve(null)
          .then(callback)
          .catch(handleErrorInNextTick)
      }
    : scheduleTimeout // TODO: Determine the best fallback here.

export interface Update {
  eventTime: number
  lane: number
  tag: number
  payload: null | ReactElement
  callback: Function | null
  next: Update | null
}

export interface UpdateQueue {
  shared: SharedQueue
  baseState: {
    element: null
    isDehydrated: false
    cache: null
    transitions: null
    pendingSuspenseBoundaries: null
  }
  effects: null
  firstBaseUpdate: null
  lastBaseUpdate: null
}

export interface SharedQueue {
  interleaved: Update | null
  lanes: number
  pending: null
}

function getCurrentUpdatePriority() {
  return currentUpdatePriority
}

function getCurrentEventPriority() {
  var currentEvent = window.event

  if (currentEvent === undefined) {
    return DefaultEventPriority
  }
  return getEventPriority(currentEvent.type)
}

class FiberRootNode {
  public current: FiberNode
  public pendingLanes: number
  public suspendedLanes: number
  public pingedLanes: number
  public eventTimes: number[] = new Array(31).fill(0)
  public expirationTimes: number[] = new Array(31).fill(0)
  public callbackNode: FiberNode | null
  public callbackPriority: number
  public expiredLanes: number
  public entangledLanes: number
  public entanglements: number[] = new Array(31).fill(0)
  public tag: number
  public finishedWork: FiberNode
  public finishedLanes: number
}

class FiberNode {
  public mode: number
  public tag: number
  public updateQueue: UpdateQueue
  public lanes: number
  public childLanes: number
  public alternate: FiberNode
  public return: FiberNode
  public stateNode: FiberRootNode

  constructor() {}
}

class ReactElement {
  constructor() {}
}

const element = new ReactElement()

function requestEventTime() {
  return performance.now()
}

const fiber = new FiberNode()

var concurrentQueues: SharedQueue[] | null = null
function pushConcurrentUpdateQueue(queue) {
  if (concurrentQueues === null) {
    concurrentQueues = [queue]
  } else {
    concurrentQueues.push(queue)
  }
}

function requestUpdateLane(fiber: FiberNode) {
  const mode = fiber.mode
  if ((mode & ConcurrentMode) === NoMode) {
    return SyncLane
  }

  var updateLane = getCurrentUpdatePriority()

  if (updateLane !== NoLane) {
    return updateLane
  }
  var eventLane = getCurrentEventPriority()
  return eventLane
}

function createUpdate(eventTime, lane) {
  var update: Update = {
    eventTime: eventTime,
    lane: lane,
    tag: UpdateState,
    payload: null,
    callback: null,
    next: null,
  }
  return update
}

var fakeActCallbackNode = {}

function cancelCallback$1(callbackNode) {
  if (callbackNode === fakeActCallbackNode) {
    return
  } // In production, always call Scheduler. This function will be stripped out.

  return cancelCallback(callbackNode)
}

var cancelCallback = Scheduler.unstable_cancelCallback

// 更新入队
function enqueueUpdate(fiber: FiberNode, update: Update, lane) {
  var updateQueue = fiber.updateQueue

  if (updateQueue === null) {
    // Only occurs if the fiber has been unmounted.
    return null
  }
  var sharedQueue = updateQueue.shared
  return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane)
}

function updateContainer(
  element: ReactElement,
  container: FiberRootNode,
  callback
) {
  var eventTime = requestEventTime()
  const current = container.current
  var lane = requestUpdateLane(fiber)
  var update = createUpdate(eventTime, lane)

  update.payload = {
    element: element,
  }
  callback = callback === undefined ? null : callback

  if (callback !== null) {
    update.callback = callback
  }

  var root = enqueueUpdate(current, update, lane)
  if (root !== null) {
    scheduleUpdateOnFiber(root, current, lane, eventTime)
  }
  return lane
}

///////////////////  scheduleUpdateOnFiber

function markRootUpdated(
  root: FiberRootNode,
  updateLane: number,
  eventTime: number
) {
  root.pendingLanes |= updateLane // If there are any suspended transitions, it's possible this new update

  if (updateLane !== IdleLane) {
    root.suspendedLanes = NoLanes
    root.pingedLanes = NoLanes
  }

  var eventTimes = root.eventTimes
  var index = laneToIndex(updateLane) // We can always overwrite an existing timestamp because we prefer the most

  eventTimes[index] = eventTime
}

function markUpdateLaneFromFiberToRoot(sourceFiber: FiberNode, lane) {
  // Update the source fiber's lanes
  sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane)
  var alternate = sourceFiber.alternate

  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane)
  }

  var node = sourceFiber
  var parent = sourceFiber.return

  while (parent !== null) {
    parent.childLanes = mergeLanes(parent.childLanes, lane)
    alternate = parent.alternate

    if (alternate !== null) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane)
    }

    node = parent
    parent = parent.return
  }

  if (node.tag === HostRoot) {
    var root = node.stateNode
    return root
  } else {
    return null
  }
}

function enqueueConcurrentClassUpdate(
  fiber: FiberNode,
  sharedQueue: SharedQueue,
  update: Update,
  lane
) {
  var interleaved = sharedQueue.interleaved
  if (interleaved === null) {
    // This is the first update. Create a circular list.
    update.next = update // At the end of the current render, this queue's interleaved updates will
    // be transferred to the pending queue.
    pushConcurrentUpdateQueue(sharedQueue)
  } else {
    update.next = interleaved.next
    interleaved.next = update
  }

  sharedQueue.interleaved = update
  return markUpdateLaneFromFiberToRoot(fiber, lane)
}

function pickArbitraryLaneIndex(lanes) {
  return 31 - clz32(lanes)
}

function laneToIndex(lane) {
  return pickArbitraryLaneIndex(lane)
}
function removeLanes(set, subset) {
  return set & ~subset
}
function intersectLanes(a, b) {
  return a & b
}
function higherEventPriority(a, b) {
  return a !== 0 && a < b ? a : b
}
function lowerEventPriority(a, b) {
  return a === 0 || a > b ? a : b
}
function isHigherEventPriority(a, b) {
  return a !== 0 && a < b
}
function includesNonIdleWork(lanes) {
  return (lanes & NonIdleLanes) !== NoLanes
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

function scheduleUpdateOnFiber(
  root: FiberRootNode,
  fiber: FiberNode,
  lane: number,
  eventTime: number
) {
  markRootUpdated(root, lane, eventTime)

  if (
    (executionContext & RenderContext) !== NoLanes &&
    root === workInProgressRoot
  ) {
    // 此更新是在渲染阶段调度的。这是个错误
    // 如果更新来自用户空间（本地除外
    // 钩子更新，处理方式不同，不会达到这个
    // 函数），但是有一些内部的 React 特性使用它作为
    // 一个实现细节，比如选择性水合。
  } else {
    if (root === workInProgressRoot) {
      // 接收到正在渲染中的树的更新。标记
      // 在这个根上有一个交错的更新工作。除非
      // `deferRenderPhaseUpdateToNextBatch` 标志关闭，这是一个渲染
      // 阶段更新。在这种情况下，我们不会将渲染阶段更新视为
      // 出于向后兼容的原因，它们是交错的。
      if ((executionContext & RenderContext) === NoContext) {
        workInProgressRootInterleavedUpdatedLanes = mergeLanes(
          workInProgressRootInterleavedUpdatedLanes,
          lane
        )
      }

      if (workInProgressRootExitStatus === RootSuspendedWithDelay) {
        // 根已经延迟暂停，这意味着这个渲染
        // 绝对不会完成。由于我们有新的更新，让我们将其标记为
        // 现在暂停，就在标记即将到来的更新之前。这有
        // 中断当前渲染并切换到更新的效果。
        // TODO：确保这不会覆盖我们已经
        // 已经开始渲染了。
        markRootSuspended$1(root, workInProgressRootRenderLanes)
      }
    }

    ensureRootIsScheduled(root, eventTime)

    // if (
    //   lane === SyncLane &&
    //   executionContext === NoContext &&
    //   (fiber.mode & ConcurrentMode) === NoMode && // Treat `act` as if it's inside `batchedUpdates`, even in legacy mode.
    //   !ReactCurrentActQueue$1.isBatchingLegacy
    // ) {
    //   resetRenderTimer()
    //   flushSyncCallbacksOnlyInLegacyMode()
    // }
  }
}

function computeExpirationTime(lane, currentTime) {
  switch (lane) {
    case SyncLane:
    case InputContinuousHydrationLane:
    case InputContinuousLane:
      // User interactions should expire slightly more quickly.
      //
      // NOTE: This is set to the corresponding constant as in Scheduler.js.
      // When we made it larger, a product metric in www regressed, suggesting
      // there's a user interaction that's being starved by a series of
      // synchronous updates. If that theory is correct, the proper solution is
      // to fix the starvation. However, this scenario supports the idea that
      // expiration times are an important safeguard when starvation
      // does happen.
      return currentTime + 250

    case DefaultHydrationLane:
    case DefaultLane:
      return currentTime + 5000
    case RetryLane1:
    case RetryLane2:
    case RetryLane3:
    case RetryLane4:
    case RetryLane5:
      // TODO: Retries should be allowed to expire if they are CPU bound for
      // too long, but when I made this change it caused a spike in browser
      // crashes. There must be some other underlying bug; not super urgent but
      // ideally should figure out why and fix it. Unfortunately we don't have
      // a repro for the crashes, only detected via production metrics.
      return NoTimestamp

    case SelectiveHydrationLane:
    case IdleHydrationLane:
    case IdleLane:
    case OffscreenLane:
      // Anything idle priority or lower should never expire.
      return NoTimestamp

    default:
      return NoTimestamp
  }
}

function markStarvedLanesAsExpired(root: FiberRootNode, currentTime) {
  var pendingLanes = root.pendingLanes
  var suspendedLanes = root.suspendedLanes
  var pingedLanes = root.pingedLanes
  var expirationTimes = root.expirationTimes

  var lanes = pendingLanes
  // 待处理队列
  while (lanes > 0) {
    var index = pickArbitraryLaneIndex(lanes)
    var lane = 1 << index
    var expirationTime = expirationTimes[index]

    if (expirationTime === NoTimestamp) {
      // 找到一个没有过期时间的待处理通道。如果它没有被暂停，或者
      // 如果它被 ping 通，则假设它受 CPU 限制。计算新的过期时间
      // 使用当前时间。
      if (
        (lane & suspendedLanes) === NoLanes ||
        (lane & pingedLanes) !== NoLanes
      ) {
        // 根据不同lane重新计算过期时间
        expirationTimes[index] = computeExpirationTime(lane, currentTime)
      }
    } else if (expirationTime <= currentTime) {
      // 车道过期
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
    case SyncLane:
      return SyncLane

    case InputContinuousHydrationLane:
      return InputContinuousHydrationLane

    case InputContinuousLane:
      return InputContinuousLane

    case DefaultHydrationLane:
      return DefaultHydrationLane

    case DefaultLane:
      return DefaultLane

    case TransitionHydrationLane:
      return TransitionHydrationLane

    case TransitionLane1:
    case TransitionLane2:
    case TransitionLane3:
    case TransitionLane4:
    case TransitionLane5:
    case TransitionLane6:
    case TransitionLane7:
    case TransitionLane8:
    case TransitionLane9:
    case TransitionLane10:
    case TransitionLane11:
    case TransitionLane12:
    case TransitionLane13:
    case TransitionLane14:
    case TransitionLane15:
    case TransitionLane16:
      return lanes & TransitionLanes

    case RetryLane1:
    case RetryLane2:
    case RetryLane3:
    case RetryLane4:
    case RetryLane5:
      return lanes & RetryLanes

    case SelectiveHydrationLane:
      return SelectiveHydrationLane

    case IdleHydrationLane:
      return IdleHydrationLane

    case IdleLane:
      return IdleLane

    case OffscreenLane:
      return OffscreenLane

    default:
      return lanes
  }
}

// lane重点处理逻辑
function getNextLanes(root: FiberRootNode, wipLanes) {
  // Early bailout if there's no pending work left.
  var pendingLanes = root.pendingLanes

  if (pendingLanes === NoLanes) {
    return NoLanes
  }

  var nextLanes = NoLanes
  var suspendedLanes = root.suspendedLanes
  var pingedLanes = root.pingedLanes

  var nonIdlePendingLanes = pendingLanes & NonIdleLanes

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
    // The only remaining work is Idle.
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
    // This should only be reachable if we're suspended
    // TODO: Consider warning in this path if a fallback timer is not scheduled.
    return NoLanes
  } // If we're already in the middle of a render, switching lanes will interrupt
  // it and we'll lose our progress. We should only do this if the new lanes are
  // higher priority.

  if (
    wipLanes !== NoLanes &&
    wipLanes !== nextLanes && // If we already suspended with a delay, then interrupting is fine. Don't
    // bother waiting until the root is complete.
    (wipLanes & suspendedLanes) === NoLanes
  ) {
    var nextLane = getHighestPriorityLane(nextLanes)
    var wipLane = getHighestPriorityLane(wipLanes)

    if (
      // Tests whether the next lane is equal or lower priority than the wip
      // one. This works because the bits decrease in priority as you go left.
      nextLane >= wipLane || // Default priority updates should not interrupt transition updates. The
      // only difference between default updates and transition updates is that
      // default updates do not support refresh transitions.
      (nextLane === DefaultLane && (wipLane & TransitionLanes) !== NoLanes)
    ) {
      // Keep working on the existing in-progress tree. Do not interrupt.
      return wipLanes
    }
  }

  if ((nextLanes & InputContinuousLane) !== NoLanes) {
    // When updates are sync by default, we entangle continuous priority updates
    // and default updates, so they render in the same batch. The only reason
    // they use separate lanes is because continuous updates should interrupt
    // transitions, but default updates should not.
    nextLanes |= pendingLanes & DefaultLane
  } // Check for entangled lanes and add them to the batch.
  //
  // A lane is said to be entangled with another when it's not allowed to render
  // in a batch that does not also include the other lane. Typically we do this
  // when multiple updates have the same source, and we only want to respond to
  // the most recent event from that source.
  //
  // Note that we apply entanglements *after* checking for partial work above.
  // This means that if a lane is entangled during an interleaved event while
  // it's already rendering, we won't interrupt it. This is intentional, since
  // entanglement is usually "best effort": we'll try our best to render the
  // lanes in the same batch, but it's not worth throwing out partially
  // completed work in order to do it.
  // TODO: Reconsider this. The counter-argument is that the partial work
  // represents an intermediate state, which we don't want to show to the user.
  // And by spending extra time finishing it, we're increasing the amount of
  // time it takes to show the final state, which is what they are actually
  // waiting for.
  //
  // For those exceptions where entanglement is semantically important, like
  // useMutableSource, we should ensure that there is no partial work at the
  // time we apply the entanglement.

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

function scheduleSyncCallback(callback) {
  // Push this callback into an internal queue. We'll flush these either in
  // the next tick, or earlier if something calls `flushSyncCallbackQueue`.
  if (syncQueue === null) {
    syncQueue = [callback]
  } else {
    // Push onto existing queue. Don't need to schedule a callback because
    // we already scheduled one when we created the queue.
    syncQueue.push(callback)
  }
}

function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && syncQueue !== null) {
    // Prevent re-entrance.
    isFlushingSyncQueue = true
    var i = 0
    var previousUpdatePriority = getCurrentUpdatePriority()

    try {
      var isSync = true
      var queue = syncQueue // TODO: Is this necessary anymore? The only user code that runs in this
      // queue is in the render or commit phases.

      setCurrentUpdatePriority(DiscreteEventPriority)

      for (; i < queue.length; i++) {
        var callback = queue[i]

        do {
          callback = callback(isSync)
        } while (callback !== null)
      }

      syncQueue = null
      includesLegacySyncCallbacks = false
    } catch (error) {
      // If something throws, leave the remaining callbacks on the queue.
      if (syncQueue !== null) {
        syncQueue = syncQueue.slice(i + 1)
      } // Resume flushing in the next tick

      scheduleCallback(ImmediatePriority, flushSyncCallbacks)
      throw error
    } finally {
      setCurrentUpdatePriority(previousUpdatePriority)
      isFlushingSyncQueue = false
    }
  }

  return null
}

function ensureRootIsScheduled(root: FiberRootNode, currentTime) {
  var existingCallbackNode = root.callbackNode // Check if any lanes are being starved by other work. If so, mark them as
  // expired so we know to work on those next.

  markStarvedLanesAsExpired(root, currentTime) // Determine the next lanes to work on, and their priority.

  var nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  )

  if (nextLanes === NoLanes) {
    // Special case: There's nothing to work on.
    if (existingCallbackNode !== null) {
      cancelCallback$1(existingCallbackNode)
    }

    root.callbackNode = null
    root.callbackPriority = NoLane
    return
  }

  // 高的优先级作为回调优先级
  var newCallbackPriority = getHighestPriorityLane(nextLanes) // Check if there's an existing task. We may be able to reuse it.

  var existingCallbackPriority = root.callbackPriority

  //act队列

  if (existingCallbackNode != null) {
    // Cancel the existing callback. We'll schedule a new one below.
    cancelCallback$1(existingCallbackNode)
  } // Schedule a new callback.

  var newCallbackNode

  if (newCallbackPriority === SyncLane) {
    // 同步模式
    // Special case: Sync React callbacks are scheduled on a special
    // internal queue

    // scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))

    // scheduleMicrotask(function () {
    //   // In Safari, appending an iframe forces microtasks to run.
    //   // https://github.com/facebook/react/issues/22459
    //   // We don't support running callbacks in the middle of render
    //   // or commit so we need to check against that.
    //   if ((executionContext & (RenderContext | CommitContext)) === NoContext) {
    //     // Note that this would still prematurely flush the callbacks
    //     // if this happens outside render or commit phase (e.g. in an event).
    //     flushSyncCallbacks()
    //   }
    // })

    newCallbackNode = null
  } else {
    var schedulerPriorityLevel

    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediatePriority
        break

      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingPriority
        break

      case DefaultEventPriority:
        schedulerPriorityLevel = NormalPriority
        break

      case IdleEventPriority:
        schedulerPriorityLevel = IdlePriority
        break

      default:
        schedulerPriorityLevel = NormalPriority
        break
    }
    // 就是 scheduler
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    )
  }

  root.callbackPriority = newCallbackPriority
  root.callbackNode = newCallbackNode
}

// function performSyncWorkOnRoot(root) {
//   if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
//     throw new Error('Should not already be working.')
//   }

//   flushPassiveEffects()
//   var lanes = getNextLanes(root, NoLanes)

//   if (!includesSomeLane(lanes, SyncLane)) {
//     // There's no remaining sync work left.
//     ensureRootIsScheduled(root, now())
//     return null
//   }

//   var exitStatus = renderRootSync(root, lanes)

//   if (root.tag !== LegacyRoot && exitStatus === RootErrored) {
//     // If something threw an error, try rendering one more time. We'll render
//     // synchronously to block concurrent data mutations, and we'll includes
//     // all pending updates are included. If it still fails after the second
//     // attempt, we'll give up and commit the resulting tree.
//     var errorRetryLanes = getLanesToRetrySynchronouslyOnError(root)

//     if (errorRetryLanes !== NoLanes) {
//       lanes = errorRetryLanes
//       exitStatus = recoverFromConcurrentError(root, errorRetryLanes)
//     }
//   }

//   if (exitStatus === RootFatalErrored) {
//     var fatalError = workInProgressRootFatalError
//     prepareFreshStack(root, NoLanes)
//     markRootSuspended$1(root, lanes)
//     ensureRootIsScheduled(root, now())
//     throw fatalError
//   }

//   if (exitStatus === RootDidNotComplete) {
//     throw new Error('Root did not complete. This is a bug in React.')
//   } // We now have a consistent tree. Because this is a sync render, we
//   // will commit it even if something suspended.

//   var finishedWork = root.current.alternate
//   root.finishedWork = finishedWork
//   root.finishedLanes = lanes
//   commitRoot(
//     root,
//     workInProgressRootRecoverableErrors,
//     workInProgressTransitions
//   ) // Before exiting, make sure there's a callback scheduled for the next
//   // pending level.

//   ensureRootIsScheduled(root, now())
//   return null
// }

function markRootSuspended(root: FiberRootNode, suspendedLanes) {
  root.suspendedLanes |= suspendedLanes
  root.pingedLanes &= ~suspendedLanes // The suspended lanes are no longer CPU-bound. Clear their expiration times.

  var expirationTimes = root.expirationTimes
  var lanes = suspendedLanes

  while (lanes > 0) {
    var index = pickArbitraryLaneIndex(lanes)
    var lane = 1 << index
    expirationTimes[index] = NoTimestamp
    lanes &= ~lane
  }
}
function markRootSuspended$1(root: FiberRootNode, suspendedLanes) {
  //暂停时，我们应该始终排除被 ping 通的通道或（更多
  //很少，因为我们试图避免它）在渲染阶段更新。
  //TODO: Lol 也许除了这个之外还有更好的方法来考虑这个
  //令人讨厌的命名函数 :)
  suspendedLanes = removeLanes(suspendedLanes, workInProgressRootPingedLanes)
  suspendedLanes = removeLanes(
    suspendedLanes,
    workInProgressRootInterleavedUpdatedLanes
  )
  markRootSuspended(root, suspendedLanes)
}

function includesBlockingLane(root: FiberRootNode, lanes) {
  var SyncDefaultLanes =
    InputContinuousHydrationLane |
    InputContinuousLane |
    DefaultHydrationLane |
    DefaultLane
  return (lanes & SyncDefaultLanes) !== NoLanes
}

function includesExpiredLane(root: FiberRootNode, lanes) {
  // This is a separate check from includesBlockingLane because a lane can
  // expire after a render has already started.
  return (lanes & root.expiredLanes) !== NoLanes
}

function finishConcurrentRender(root: FiberRootNode, exitStatus, lanes) {
  switch (exitStatus) {
    case RootInProgress:
    case RootFatalErrored: {
      throw new Error('Root did not complete. This is a bug in React.')
    }
    // Flow knows about invariant, so it complains if I add a break
    // statement, but eslint doesn't know about invariant, so it complains
    // if I do. eslint-disable-next-line no-fallthrough

    case RootErrored: {
      break
    }

    case RootSuspended: {
      break
    }

    case RootSuspendedWithDelay: {
      break
    }

    case RootCompleted:
      break

    default:
  }
}

function renderRootSync(root, lanes) {
  var prevExecutionContext = executionContext
  executionContext |= RenderContext
  // var prevDispatcher = pushDispatcher() // If the root or lanes have changed, throw out the existing stack

  do {
    try {
      workLoopSync()
      break
    } catch (thrownValue) {
      // handleError(root, thrownValue)
    }
  } while (true)

  executionContext = prevExecutionContext
  // popDispatcher(prevDispatcher)

  if (workInProgress !== null) {
    // This is a sync render, so we should have finished the whole tree.
    throw new Error(
      'Cannot commit an incomplete root. This error is likely caused by a ' +
        'bug in React. Please file an issue.'
    )
  }

  workInProgressRoot = null
  workInProgressRootRenderLanes = NoLanes
  return workInProgressRootExitStatus
}

function renderRootConcurrent(root, lanes) {
  var prevExecutionContext = executionContext
  executionContext |= RenderContext
  // var prevDispatcher = pushDispatcher() // If the root or lanes have changed, throw out the existing stack
  // and prepare a fresh one. Otherwise we'll continue where we left off.

  do {
    try {
      workLoopConcurrent()
      break
    } catch (thrownValue) {
      // handleError(root, thrownValue)
    }
  } while (true)

  // popDispatcher(prevDispatcher)
  executionContext = prevExecutionContext

  if (workInProgress !== null) {
    // Still work remaining.

    return RootInProgress
  } else {
    // Completed the tree.

    workInProgressRoot = null
    workInProgressRootRenderLanes = NoLanes // Return the final exit status.

    return workInProgressRootExitStatus
  }
}

function isRenderConsistentWithExternalStores(finishedWork) {
  // 在渲染树中搜索外部存储读取，并检查是否
  // 商店在并发事件中发生了突变。故意使用迭代
  // 循环而不是递归，所以我们可以提前退出。
  var node = finishedWork

  while (true) {
    if (node.flags & StoreConsistency) {
      var updateQueue = node.updateQueue

      if (updateQueue !== null) {
        var checks = updateQueue.stores

        if (checks !== null) {
          for (var i = 0; i < checks.length; i++) {
            var check = checks[i]
            var getSnapshot = check.getSnapshot
            var renderedValue = check.value

            try {
              if (!Object.is(getSnapshot(), renderedValue)) {
                // Found an inconsistent store.
                return false
              }
            } catch (error) {
              // If `getSnapshot` throws, return `false`. This will schedule
              // a re-render, and the error will be rethrown during render.
              return false
            }
          }
        }
      }
    }

    var child = node.child

    if (node.subtreeFlags & StoreConsistency && child !== null) {
      child.return = node
      node = child
      continue
    }

    if (node === finishedWork) {
      return true
    }

    while (node.sibling === null) {
      if (node.return === null || node.return === finishedWork) {
        return true
      }

      node = node.return
    }

    node.sibling.return = node.return
    node = node.sibling
  } // Flow doesn't know this is unreachable, but eslint does
  // eslint-disable-next-line no-unreachable

  return true
}

// 真正每次执行的回调
function performConcurrentWorkOnRoot(root: FiberRootNode, didTimeout) {
  currentEventTime = NoTimestamp

  if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
    throw new Error('Should not already be working.')
  } // Flush any pending passive effects before deciding which lanes to work on,
  // in case they schedule additional work.

  var originalCallbackNode = root.callbackNode
  var didFlushPassiveEffects = flushPassiveEffects()

  if (didFlushPassiveEffects) {
    // Something in the passive effect phase may have canceled the current task.
    // Check if the task node for this root was changed.
    if (root.callbackNode !== originalCallbackNode) {
      // The current task was canceled. Exit. We don't need to call
      // `ensureRootIsScheduled` because the check above implies either that
      // there's a new task, or that there's no remaining work on this root.
      return null
    }
  } // Determine the next lanes to work on, using the fields stored
  // on the root.

  //
  var lanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  )

  if (lanes === NoLanes) {
    // Defensive coding. This is never expected to happen.
    return null
  } // We disable time-slicing in some cases: if the work has been CPU-bound
  // for too long ("expired" work, to prevent starvation), or we're in
  // sync-updates-by-default mode.
  // TODO: We only check `didTimeout` defensively, to account for a Scheduler
  // bug we're still investigating. Once the bug in Scheduler is fixed,
  // we can remove this, since we track expiration ourselves.

  var shouldTimeSlice =
    !includesBlockingLane(root, lanes) &&
    !includesExpiredLane(root, lanes) &&
    !didTimeout
  var exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes)

  if (exitStatus !== RootInProgress) {
    if (exitStatus === RootErrored) {
      // 如果出现错误，请尝试再渲染一次。出色地
      // 同步渲染以阻止并发数据突变，我们将
      // 包括所有待处理的更新。如果之后仍然失败
      // 第二次尝试，我们将放弃并提交生成的树。var errorRetryLanes = getLanesToRetrySynchronouslyOnError(root)
      //
    }

    if (exitStatus === RootFatalErrored) {
      var fatalError = workInProgressRootFatalError
      throw fatalError
    }

    if (exitStatus === RootDidNotComplete) {
      // The render unwound without completing the tree. This happens in special
      // cases where need to exit the current render without producing a
      // consistent tree or committing.
      //
      // This should only happen during a concurrent render, not a discrete or
      // synchronous update. We should have already checked for this when we
      // unwound the stack.
      markRootSuspended$1(root, lanes)
    } else {
      // 渲染完成。
      // 检查此渲染是否可能已屈服于并发事件，如果是，则
      // 确认任何新渲染的商店都是一致的。
      // TODO：即使是并发渲染也可能永远不会产生
      // 到主线程，如果它足够快，或者它是否过期。我们可以
      // 在这种情况下也跳过一致性检查。
      var renderWasConcurrent = !includesBlockingLane(root, lanes)
      var finishedWork = root.current.alternate

      if (
        renderWasConcurrent &&
        !isRenderConsistentWithExternalStores(finishedWork)
      ) {
        // A store was mutated in an interleaved event. Render again,
        // synchronously, to block further mutations.
        exitStatus = renderRootSync(root, lanes) // We need to check again if something threw

        if (exitStatus === RootErrored) {
          // 错误处理
        }

        if (exitStatus === RootFatalErrored) {
          var _fatalError = workInProgressRootFatalError
          // prepareFreshStack(root, NoLanes)
          // markRootSuspended$1(root, lanes)
          // ensureRootIsScheduled(root, now())
          throw _fatalError
        }
      } // We now have a consistent tree. The next step is either to commit it,
      // or, if something suspended, wait to commit it after a timeout.

      root.finishedWork = finishedWork
      root.finishedLanes = lanes
      finishConcurrentRender(root, exitStatus, lanes)
    }
  }

  ensureRootIsScheduled(root, performance.now())

  if (root.callbackNode === originalCallbackNode) {
    // The task node scheduled for this root is the same one that's
    // currently executed. Need to return a continuation.
    return performConcurrentWorkOnRoot.bind(null, root)
  }

  return null
}

function flushPassiveEffects() {
  // 刷新副作用

  return false
}
