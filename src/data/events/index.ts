import type { EventDef } from '../../core/events';
import { COMMON_EVENTS } from './common';
import { WEEK1_EVENTS } from './week1';

export const ALL_EVENTS: EventDef[] = [...WEEK1_EVENTS, ...COMMON_EVENTS];
