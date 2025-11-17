import { useCallback, useMemo } from "react";
import dayjs from "../utils/dayjs";

import type { ScheduleInstance } from "../models/schedule";

export const useSchedule = (schedule?: ScheduleInstance) => {
  const getShiftById = useCallback(
    (id: string) => schedule?.shifts?.find((shift) => shift.id === id),
    [schedule?.shifts]
  );

  const getAssignmentById = useCallback(
    (id: string) => schedule?.assignments?.find((assign) => assign.id === id),
    [schedule?.assignments]
  );

  const getStaffById = useCallback(
    (id: string) => schedule?.staffs?.find((staff) => staff.id === id),
    [schedule?.staffs]
  );

  const validDates = useMemo(() => {
    if (!schedule?.scheduleStartDate || !schedule?.scheduleEndDate) return [];

    const dates: string[] = [];
    let currentDate = dayjs(schedule.scheduleStartDate);
    const endDate = dayjs(schedule.scheduleEndDate);

    while (currentDate.isSameOrBefore(endDate)) {
      dates.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    return dates;
  }, [schedule?.scheduleStartDate, schedule?.scheduleEndDate]);

  const getDatesBetween = useCallback((startDate: string, endDate: string) => {
    const dates: string[] = [];
    const start = dayjs(startDate, "DD.MM.YYYY");
    const end = dayjs(endDate, "DD.MM.YYYY");
    let current = start;

    while (current.isSameOrBefore(end)) {
      dates.push(current.format("DD-MM-YYYY"));
      current = current.add(1, "day");
    }

    return dates;
  }, []);

  return {
    getShiftById,
    getAssignmentById,
    getStaffById,
    validDates,
    getDatesBetween,
  } as const;
};

export default useSchedule;
