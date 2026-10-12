import type { Cond } from '../../core/conditions';
import type { Effect } from '../../core/effects';
import type { BackdropKey, ActorPlacement, Step } from '../../core/events';
import type { CharId, LocId, Segment } from '../../core/types';

export interface QuestStepDef {
  /** notebook line, without time or place: "얼음 나르기" */
  task: string;
  /** label on the task button inside the location scene */
  button: string;
  loc: LocId;
  seg: Segment;
  /** number of times this step must be done (each on a different day) */
  repeat?: number;
  /** only available on a later day than the previous step */
  nextDay?: boolean;
  minDay?: number;
  requires?: Cond | Cond[];
  /** text shown in the notebook while `requires` is unmet */
  waitingText?: string;
  bg?: BackdropKey;
  actors?: ActorPlacement[];
  /** scene per repetition (index = progress); last one is reused */
  scenes: Step[][];
  /** applied after this step (all repetitions) is finished */
  effects?: Effect[];
}

export interface QuestDef {
  id: string;
  title: string;
  giver: CharId;
  steps: QuestStepDef[];
  /** applied when the last step finishes */
  complete?: Effect[];
}
