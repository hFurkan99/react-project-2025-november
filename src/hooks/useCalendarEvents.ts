import { useCallback, useEffect, useMemo, useState } from "react";
import type { EventInput } from "@fullcalendar/core";
import dayjs from "../utils/dayjs";
import Logger from "../utils/logger";
import { getDiagonalGradient, getStaffColor } from "../utils/colorUtils";
import type { ScheduleInstance } from "../models/schedule";
import useSchedule from "./useSchedule";

type PairInfo = { staffId: string; name: string; color: string };

export default function useCalendarEvents(
  schedule?: ScheduleInstance,
  selectedStaffId?: string | null
) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [offDaysInSchedule, setOffDaysInSchedule] = useState<string[]>([]);
  const [pairDates, setPairDates] = useState<Map<string, PairInfo[]>>(
    new Map()
  );

  const {
    getShiftById,
    getAssignmentById,
    getStaffById,
    getDatesBetween,
    validDates,
  } = useSchedule(schedule);

  const generate = useCallback(() => {
    if (!schedule?.assignments || !selectedStaffId) {
      setEvents([]);
      setOffDaysInSchedule([]);
      setPairDates(new Map());
      return;
    }

    const staffAssignments = schedule.assignments.filter(
      (assign) => assign.staffId === selectedStaffId
    );

    const calendarEvents: EventInput[] = staffAssignments
      .map((assignment) => {
        try {
          const assignmentDate = dayjs
            .utc(assignment.shiftStart)
            .format("YYYY-MM-DD");
          const isValidDate = validDates.includes(assignmentDate);
          const shift = getShiftById(assignment.shiftId);
          const isUpdated = getAssignmentById(assignment.id)?.isUpdated;

          const gradientStyle = getDiagonalGradient(
            shift?.name || "Unknown",
            assignment.staffId
          );

          const start = dayjs.utc(assignment.shiftStart);
          const end = dayjs.utc(assignment.shiftEnd);

          if (!start.isValid() || !end.isValid()) {
            Logger.warn("Invalid date in assignment:", assignment);
            return null;
          }

          return {
            id: assignment.id,
            title: shift?.name || "Unknown Shift",
            start: start.toISOString(),
            end: end.toISOString(),
            staffId: assignment.staffId,
            shiftId: assignment.shiftId,
            shiftStart: assignment.shiftStart,
            shiftEnd: assignment.shiftEnd,
            backgroundColor: "transparent",
            borderColor: "transparent",
            extendedProps: {
              gradientStyle,
            },
            className: [
              "event",
              isUpdated ? "highlight" : "",
              !isValidDate ? "invalid-date" : "",
            ]
              .filter(Boolean)
              .join(" "),
          };
        } catch (error) {
          Logger.error("Error processing assignment:", assignment, error);
          return null;
        }
      })
      .filter((event) => event !== null) as EventInput[];

    const selectedStaff = schedule.staffs?.find(
      (staff) => staff.id === selectedStaffId
    );
    const offDays = selectedStaff?.offDays || [];
    const pairList = selectedStaff?.pairList || [];

    const pairDateMap = new Map<string, PairInfo[]>();

    pairList.forEach((pair) => {
      const pairStaff = getStaffById(pair.staffId);
      if (!pairStaff) {
        Logger.warn("⚠️ Pair staff not found:", pair.staffId);
        return;
      }

      const pairColor = getStaffColor(pair.staffId);
      const startDate = dayjs(pair.startDate, "DD.MM.YYYY");
      const endDate = dayjs(pair.endDate, "DD.MM.YYYY");

      if (!startDate.isValid() || !endDate.isValid()) {
        Logger.warn("Invalid pair date:", pair);
        return;
      }

      let currentDate = startDate;
      while (currentDate.isSameOrBefore(endDate, "day")) {
        const dateKey = currentDate.format("DD-MM-YYYY");
        const existing = pairDateMap.get(dateKey) || [];
        existing.push({
          staffId: pair.staffId,
          name: pairStaff.name,
          color: pairColor,
        });
        pairDateMap.set(dateKey, existing);
        currentDate = currentDate.add(1, "day");
      }
    });

    setPairDates(pairDateMap);

    if (schedule.scheduleStartDate && schedule.scheduleEndDate) {
      const allScheduleDates = getDatesBetween(
        dayjs(schedule.scheduleStartDate).format("DD.MM.YYYY"),
        dayjs(schedule.scheduleEndDate).format("DD.MM.YYYY")
      );

      const offDaysFormatted = allScheduleDates.filter((date) => {
        const formattedDate = dayjs(date, "DD-MM-YYYY").format("DD.MM.YYYY");
        return offDays.includes(formattedDate);
      });

      setOffDaysInSchedule(offDaysFormatted);
    }

    setEvents(calendarEvents);
  }, [
    schedule,
    selectedStaffId,
    validDates,
    getShiftById,
    getAssignmentById,
    getStaffById,
    getDatesBetween,
  ]);

  useEffect(() => {
    generate();
  }, [generate]);

  const memo = useMemo(
    () => ({ events, offDaysInSchedule, pairDates }),
    [events, offDaysInSchedule, pairDates]
  );

  return { ...memo, regenerate: generate } as const;
}
