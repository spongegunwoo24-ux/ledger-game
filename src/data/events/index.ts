import type { EventDef } from '../../core/events';
import { COMMON_EVENTS } from './common';
import { WEEK1_EVENTS } from './week1';
import { WEEK2_3_EVENTS } from './week2_3';

export const ALL_EVENTS: EventDef[] = [...WEEK1_EVENTS, ...WEEK2_3_EVENTS, ...COMMON_EVENTS];
