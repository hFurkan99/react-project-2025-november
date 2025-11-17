import { useCallback, useEffect, useMemo, useState } from "react";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core/index.js";
import dayjs from "../../utils/dayjs";

import { useAppDispatch } from "../../store/hooks";
import { updateAssignmentDate } from "../../store/schedule/actions";
import type { ScheduleInstance } from "../../models/schedule";
import type { UserInstance } from "../../models/user";
import { getDiagonalGradient } from "../../utils/colorUtils";

import StaffList from "./StaffList";
import CalendarView from "./CalendarView";
import EventModal, { type EventDetail } from "./EventModal";
import useSchedule from "../../hooks/useSchedule";
import useCalendarEvents from "../../hooks/useCalendarEvents";

type CalendarContainerProps = {
  schedule: ScheduleInstance;
  auth: UserInstance;
};

const CalendarContainer = ({ schedule, auth }: CalendarContainerProps) => {
  const dispatch = useAppDispatch();
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [initialDate, setInitialDate] = useState<Date>(
    dayjs(schedule?.scheduleStartDate).toDate()
  );
  const [eventDetailModal, setEventDetailModal] = useState<{
    isOpen: boolean;
    details: EventDetail | null;
  }>({
    isOpen: false,
    details: null,
  });

  const { getShiftById, getStaffById } = useSchedule(schedule);
  const { events, offDaysInSchedule, pairDates } = useCalendarEvents(
    schedule,
    selectedStaffId
  );

  useEffect(() => {
    if (schedule?.staffs?.length > 0 && !selectedStaffId) {
      setSelectedStaffId(schedule.staffs[0].id);
    }
  }, [schedule?.staffs, selectedStaffId]);

  useEffect(() => {
    if (schedule?.staffs?.length > 0 && !selectedStaffId) {
      setSelectedStaffId(schedule.staffs[0].id);
    }
  }, [schedule?.staffs, selectedStaffId]);

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const { event } = clickInfo;
      const { staffId, shiftId, shiftStart, shiftEnd } = event.extendedProps;

      const staff = getStaffById(staffId);
      const shift = getShiftById(shiftId);

      if (!staff || !shift) return;

      const eventDate = dayjs(event.start).format("DD-MM-YYYY");
      const pairsForDate = pairDates.get(eventDate);

      setEventDetailModal({
        isOpen: true,
        details: {
          staffName: staff.name,
          shiftName: shift.name,
          date: dayjs(event.start).format("DD.MM.YYYY"),
          startTime: dayjs(shiftStart).format("HH:mm"),
          endTime: dayjs(shiftEnd).format("HH:mm"),
          pairs: pairsForDate,
          eventId: event.id,
          originalDate: event.start || undefined,
        },
      });
    },
    [getStaffById, getShiftById, pairDates]
  );

  const closeModal = useCallback(() => {
    setEventDetailModal({ isOpen: false, details: null });
  }, []);

  const handleDateClick = useCallback(
    (date: Date) => {
      const dateKey = dayjs(date).format("DD-MM-YYYY");
      const pairsForDate = pairDates.get(dateKey);

      if (!pairsForDate || pairsForDate.length === 0) return;

      const selectedStaff = schedule.staffs?.find(
        (s) => s.id === selectedStaffId
      );
      if (!selectedStaff) return;

      setEventDetailModal({
        isOpen: true,
        details: {
          staffName: selectedStaff.name,
          date: dayjs(date).format("DD.MM.YYYY"),
          pairs: pairsForDate,
        },
      });
    },
    [pairDates, schedule.staffs, selectedStaffId]
  );

  const handleStaffSelect = useCallback((staffId: string) => {
    setSelectedStaffId(staffId);
  }, []);

  const handleEventDrop = useCallback(
    (dropInfo: EventDropArg) => {
      const { event, revert } = dropInfo;
      const assignmentId = event.id;

      if (!event.start || !event.end) {
        revert();
        return;
      }

      const newStartDate = dayjs.utc(event.start).toISOString();
      const newEndDate = dayjs.utc(event.end).toISOString();
      dispatch(
        updateAssignmentDate({
          assignmentId,
          newStartDate,
          newEndDate,
        })
      );
    },
    [dispatch]
  );

  const handleMoveEvent = useCallback(
    (eventId: string, newDate: Date) => {
      const assignment = schedule.assignments?.find((a) => a.id === eventId);
      if (!assignment) return;

      const shift = getShiftById(assignment.shiftId);
      if (!shift) return;

      const parseTime = (t = "") => {
        const [hh = "0", mm = "0"] = (t || "").split(":");
        return { hh: Number(hh), mm: Number(mm) };
      };
      const { hh: sH, mm: sM } = parseTime(shift.shiftStart);
      const { hh: eH, mm: eM } = parseTime(shift.shiftEnd);

      const startLocal = dayjs(newDate)
        .hour(sH)
        .minute(sM)
        .second(0)
        .millisecond(0);
      const endLocal = dayjs(newDate)
        .hour(eH)
        .minute(eM)
        .second(0)
        .millisecond(0);

      const newStart = dayjs.utc(startLocal.toDate()).toISOString();
      const newEnd = dayjs.utc(endLocal.toDate()).toISOString();

      dispatch(
        updateAssignmentDate({
          assignmentId: eventId,
          newStartDate: newStart,
          newEndDate: newEnd,
        })
      );
    },
    [dispatch, schedule.assignments, getShiftById]
  );

  const selectedStaff = useMemo(
    () => schedule?.staffs?.find((s) => s.id === selectedStaffId),
    [schedule?.staffs, selectedStaffId]
  );

  const shiftLegend = useMemo(() => {
    if (!schedule?.shifts || !selectedStaffId) return [];

    const staffAssignments =
      schedule.assignments?.filter(
        (assign) => assign.staffId === selectedStaffId
      ) || [];

    const uniqueShiftIds = new Set(staffAssignments.map((a) => a.shiftId));

    return Array.from(uniqueShiftIds)
      .map((shiftId) => {
        const shift = getShiftById(shiftId);
        if (!shift) return null;

        const gradientStyle = getDiagonalGradient(shift.name, selectedStaffId);
        return {
          name: shift.name,
          gradient: gradientStyle,
        };
      })
      .filter(Boolean) as Array<{ name: string; gradient: string }>;
  }, [schedule?.shifts, schedule?.assignments, selectedStaffId, getShiftById]);

  return (
    <div className="calendar-section">
      <div className="calendar-wrapper">
        {/* Staff Selection List */}
        <StaffList
          staffs={schedule?.staffs || []}
          selectedStaffId={selectedStaffId}
          onStaffSelect={handleStaffSelect}
        />

        {/* Calendar View */}
        <CalendarView
          locale={auth.language}
          initialDate={initialDate}
          events={events}
          offDaysInSchedule={offDaysInSchedule}
          pairDates={pairDates}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          onInitialDateChange={setInitialDate}
          onEventDrop={handleEventDrop}
          selectedStaff={selectedStaff}
          shiftLegend={shiftLegend}
        />
      </div>

      {/* Event Detail Modal */}
      <EventModal
        isOpen={eventDetailModal.isOpen}
        details={eventDetailModal.details}
        onClose={closeModal}
        onMoveEvent={handleMoveEvent}
      />
    </div>
  );
};

export default CalendarContainer;
