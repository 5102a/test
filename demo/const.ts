export enum Mode {
  NoMode = 0,
  ConcurrentMode = 1,
}

export enum LaneType {
  SyncLane /**          */ = 0b0000000000000000000000000000001,
  InputContinuousLane /**/ = 0b0000000000000000000000000000100,
  DefaultLane /**       */ = 0b0000000000000000000000000010000,
  IdleLane /**          */ = 0b0100000000000000000000000000000,
  NoLane /**            */ = 0b0000000000000000000000000000000,
}

export enum LanesType {
  NoLanes /**            */ = 0b0000000000000000000000000000000,
  NonIdleLanes = 0b1111111111111111111111111111,
}

export enum Context {
  NoContext = 0b000,
  BatchedContext = 0b001,
  RenderContext = 0b010,
  CommitContext = 0b100,
}

export enum RootStatus {
  RootInProgress = 0,
  RootFatalErrored = 1,
  RootErrored = 2,
  RootSuspended = 3,
  RootSuspendedWithDelay = 4,
  RootCompleted = 5,
  RootDidNotComplete = 6,
}

export enum Priority  {
  DiscreteEventPriority = LaneType.SyncLane,
  ContinuousEventPriority = LaneType.InputContinuousLane,
  DefaultEventPriority = LaneType.DefaultLane,
  IdleEventPriority = LaneType.IdleLane,
}

export enum State {
  UpdateState = 0,
  ReplaceState = 1,
  ForceUpdate = 2,
  CaptureUpdate = 3,
}

export enum NodeTag {
  HostRoot = 3,
  FunctionComponent = 0,
}

export enum RootTag {
  LegacyRoot = 0,
  ConcurrentRoot = 1,
}
