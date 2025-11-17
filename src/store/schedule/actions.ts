import { createAction } from "redux-actions";
import types from "./types";
import type { UpdateAssignmentDatePayload } from "./types";

export const fetchSchedule = createAction(types.FETCH_SCHEDULE);
export const fetchScheduleSuccess = createAction(types.FETCH_SCHEDULE_SUCCESS);
export const fetchScheduleFailed = createAction(types.FETCH_SCHEDULE_FAILED);
export const updateAssignmentDate = createAction(
  types.UPDATE_ASSIGNMENT_DATE,
  (payload: UpdateAssignmentDatePayload) => payload
) as (payload: UpdateAssignmentDatePayload) => {
  type: string;
  payload: UpdateAssignmentDatePayload;
};
