import type { FC } from "react";
import { useRef, useState, useEffect } from "react";
import SelectedStaffHeader from "./SelectedStaffHeader";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventInput,
  EventClickArg,
  EventContentArg,
  EventDropArg,
} from "@fullcalendar/core/index.js";
import dayjs from "../../utils/dayjs";

const MOBILE_BREAKPOINT = 768; // Matches $breakpoint-mobile

type Staff = {
  id: string;
  name: string;
};

type ShiftLegendItem = {
  name: string;
  gradient: string;
};

type CalendarViewProps = {
  locale: string;
  initialDate: Date;
  events: EventInput[];
  offDaysInSchedule: string[];
  pairDates: Map<
    string,
    Array<{ staffId: string; name: string; color: string }>
  >;
  onEventClick: (clickInfo: EventClickArg) => void;
  onDateClick: (date: Date) => void;
  onInitialDateChange: (date: Date) => void;
  onEventDrop: (dropInfo: EventDropArg) => void;
  selectedStaff?: Staff | undefined;
  shiftLegend?: ShiftLegendItem[];
};

const CalendarView: FC<CalendarViewProps> = ({
  locale,
  initialDate,
  events,
  offDaysInSchedule,
  pairDates,
  onEventClick,
  onDateClick,
  onInitialDateChange,
  onEventDrop,
  selectedStaff,
  shiftLegend = [],
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<"prev" | "next" | null>(null);
  const [navigationProgress, setNavigationProgress] = useState(0);
  const navigationTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= MOBILE_BREAKPOINT
  );

  const plugins = [dayGridPlugin, interactionPlugin];

  const getZoneWidth = () => {
    const width = window.innerWidth;
    if (width >= 1600) return 100; // xlarge
    if (width > 1300) return 100; // large
    if (width > 1024) return 90; // desktop
    if (width > 768) return 70; // tablet
    return 0; // mobile - hidden
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isMobile) return;

      const calendarEl = document.querySelector(".fc-view-harness");
      if (!calendarEl) return;

      const rect = calendarEl.getBoundingClientRect();
      const zoneWidth = getZoneWidth();
      const mouseX = e.clientX;

      if (mouseX - rect.left < zoneWidth) {
        setHoveredZone("prev");
      } else if (rect.right - mouseX < zoneWidth) {
        setHoveredZone("next");
      } else {
        setHoveredZone(null);
        setNavigationProgress(0);
        if (navigationTimerRef.current) {
          clearTimeout(navigationTimerRef.current);
          navigationTimerRef.current = null;
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    };

    if (isDragging && !isMobile) {
      document.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isDragging, isMobile]);

  useEffect(() => {
    if (!isDragging || !hoveredZone || isMobile) {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
        navigationTimerRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setNavigationProgress(0);
      return;
    }

    const triggerNavigation = () => {
      const calendarApi = calendarRef.current?.getApi();
      if (!calendarApi) return;

      const calendarEl = document.querySelector(".fc-view-harness");
      if (calendarEl) {
        calendarEl.classList.add("month-transitioning");
      }

      if (hoveredZone === "prev") {
        calendarApi.prev();
      } else if (hoveredZone === "next") {
        calendarApi.next();
      }

      setTimeout(() => {
        if (calendarEl) {
          calendarEl.classList.remove("month-transitioning");
        }
      }, 300);
    };

    const startNavigationCycle = () => {
      setNavigationProgress(0);
      const startTime = Date.now();
      const duration = 1000;

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }

      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setNavigationProgress(progress);
      }, 16);

      navigationTimerRef.current = window.setTimeout(() => {
        triggerNavigation();

        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }

        setTimeout(() => {
          if (isDragging && hoveredZone) {
            startNavigationCycle();
          }
        }, 350);
      }, duration);
    };

    startNavigationCycle();

    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isDragging, hoveredZone, isMobile]);

  const RenderEventContent = ({
    eventInfo,
  }: {
    eventInfo: EventContentArg;
  }) => {
    const gradientStyle = eventInfo.event.extendedProps.gradientStyle;

    return (
      <div
        className="event-content"
        style={{
          background: gradientStyle,
          width: "100%",
          height: "100%",
          padding: "2px 4px",
          borderRadius: "3px",
        }}
      >
        <p>{eventInfo.event.title}</p>
      </div>
    );
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Selected Staff Header - Above toolbar */}
      {selectedStaff && (
        <SelectedStaffHeader
          selectedStaff={selectedStaff}
          shiftLegend={shiftLegend}
        />
      )}

      <div style={{ position: "relative", overflow: "hidden" }}>
        {isDragging && window.innerWidth > MOBILE_BREAKPOINT && (
          <>
            <div
              className={`navigation-zone navigation-zone-left ${
                hoveredZone === "prev" ? "active" : ""
              }`}
            >
              <div className="navigation-zone-content">
                <span className="navigation-arrow">←</span>
                <span className="navigation-text">Önceki Ay</span>
              </div>
              {hoveredZone === "prev" && (
                <div className="navigation-progress">
                  <div
                    className="navigation-progress-bar"
                    style={{ width: `${navigationProgress}%` }}
                  />
                </div>
              )}
            </div>
            <div
              className={`navigation-zone navigation-zone-right ${
                hoveredZone === "next" ? "active" : ""
              }`}
            >
              <div className="navigation-zone-content">
                <span className="navigation-text">Sonraki Ay</span>
                <span className="navigation-arrow">→</span>
              </div>
              {hoveredZone === "next" && (
                <div className="navigation-progress">
                  <div
                    className="navigation-progress-bar"
                    style={{ width: `${navigationProgress}%` }}
                  />
                </div>
              )}
            </div>
          </>
        )}
        <FullCalendar
          ref={calendarRef}
          locale={locale}
          plugins={plugins}
          height="auto"
          handleWindowResize={true}
          selectable={true}
          editable={!isMobile}
          eventOverlap={true}
          eventDurationEditable={false}
          eventConstraint={{
            start: "1900-01-01",
            end: "2100-12-31",
          }}
          initialView="dayGridMonth"
          initialDate={initialDate}
          events={events}
          firstDay={1}
          dayMaxEventRows={4}
          displayEventTime={false}
          displayEventEnd={false}
          nextDayThreshold="00:00:00"
          fixedWeekCount={true}
          showNonCurrentDates={true}
          titleFormat={{ year: "numeric", month: "long" }}
          eventClick={onEventClick}
          eventDrop={onEventDrop}
          eventDragStart={() => setIsDragging(true)}
          eventDragStop={() => {
            setIsDragging(false);
            setHoveredZone(null);
            setNavigationProgress(0);
            if (navigationTimerRef.current) {
              clearTimeout(navigationTimerRef.current);
              navigationTimerRef.current = null;
            }
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }}
          dateClick={(arg) => {
            onDateClick(arg.date);
          }}
          eventContent={(eventInfo: EventContentArg) => (
            <RenderEventContent eventInfo={eventInfo} />
          )}
          datesSet={() => {
            const prevButton = document.querySelector(
              ".fc-prev-button"
            ) as HTMLButtonElement;
            const nextButton = document.querySelector(
              ".fc-next-button"
            ) as HTMLButtonElement;

            if (prevButton) prevButton.disabled = false;
            if (nextButton) nextButton.disabled = false;

            if (calendarRef?.current?.getApi().getDate()) {
              const currentDate = calendarRef.current.getApi().getDate();
              if (!dayjs(currentDate).isSame(initialDate, "month")) {
                onInitialDateChange(currentDate);
              }
            }
          }}
          dayCellContent={({ date }) => {
            const dateStrAlt = dayjs(date).format("DD-MM-YYYY");

            const calendarApi = calendarRef?.current?.getApi();
            const activeDate = calendarApi?.getDate() || initialDate;

            const cellMonth = dayjs(date).month();
            const viewingMonth = dayjs(activeDate).month();
            const cellYear = dayjs(date).year();
            const viewingYear = dayjs(activeDate).year();

            const isCurrentMonth =
              cellMonth === viewingMonth && cellYear === viewingYear;
            const isOffDay = offDaysInSchedule.includes(dateStrAlt);

            const pairsForDate = pairDates.get(dateStrAlt);
            const hasPairs = pairsForDate && pairsForDate.length > 0;

            return (
              <div
                className={[
                  !isCurrentMonth && "date-range-disabled",
                  isOffDay && "off-day-cell",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {dayjs(date).date()}
                    {isOffDay && (
                      <span style={{ fontSize: "12px", opacity: 0.7 }}>🏖️</span>
                    )}
                  </div>
                  {hasPairs && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "2px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "100%",
                        height: "3px",
                        display: "flex",
                        gap: "1px",
                      }}
                    >
                      {pairsForDate.map((pair, idx) => (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            backgroundColor: pair.color,
                            borderRadius: "1px",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default CalendarView;
