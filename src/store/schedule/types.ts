export default {
  FETCH_SCHEDULE: "FETCH_SCHEDULE",
  FETCH_SCHEDULE_SUCCESS: "FETCH_SCHEDULE_SUCCESS",
  FETCH_SCHEDULE_FAILED: "FETCH_SCHEDULE_FAILED",
  UPDATE_ASSIGNMENT_DATE: "UPDATE_ASSIGNMENT_DATE",
};

export type UpdateAssignmentDatePayload = {
  assignmentId: string;
  newStartDate: string;
  newEndDate: string;
};
