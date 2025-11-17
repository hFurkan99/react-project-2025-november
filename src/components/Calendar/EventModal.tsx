import type { FC } from "react";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const MOBILE_BREAKPOINT = 768; // Matches $breakpoint-mobile

export type EventDetail = {
  staffName: string;
  shiftName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  pairs?: Array<{ name: string; color: string }>;
  eventId?: string;
  originalDate?: Date;
};

type EventModalProps = {
  isOpen: boolean;
  details: EventDetail | null;
  onClose: () => void;
  onMoveEvent?: (eventId: string, newDate: Date) => void;
};

const EventModal: FC<EventModalProps> = ({
  isOpen,
  details,
  onClose,
  onMoveEvent,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isOpen || !details) return null;

  const hasShift = details.shiftName && details.startTime && details.endTime;
  const hasPairs = details.pairs && details.pairs.length > 0;
  const canMove = isMobile && hasShift && details.eventId && onMoveEvent;

  const handleMoveEvent = () => {
    if (!selectedDate || !details.eventId || !onMoveEvent) return;

    onMoveEvent(details.eventId, selectedDate);
    onClose();
  };

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <h3>{hasShift ? "Etkinlik Detayları" : "Pair Detayları"}</h3>
          <button className="close-button" onClick={onClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        <div className="event-modal-body">
          <div className="detail-row">
            <span className="detail-label">Personel:</span>
            <span className="detail-value">{details.staffName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Tarih:</span>
            <span className="detail-value">{details.date}</span>
          </div>
          {hasShift && (
            <>
              <div className="detail-row">
                <span className="detail-label">Vardiya:</span>
                <span className="detail-value">{details.shiftName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Başlangıç Saati:</span>
                <span className="detail-value">{details.startTime}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Bitiş Saati:</span>
                <span className="detail-value">{details.endTime}</span>
              </div>
            </>
          )}
          {hasPairs && (
            <div className="detail-row">
              <span className="detail-label">Gün İçindeki Ortak(ları):</span>
              <div className="detail-value pair-list">
                {details.pairs!.map((pair, index) => (
                  <div
                    key={index}
                    className="pair-item"
                    style={{
                      borderLeft: `4px solid ${pair.color}`,
                      paddingLeft: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    {pair.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Move Event Section */}
          {canMove && (
            <div className="event-move-section">
              <div className="detail-row">
                <span className="detail-label">Yeni Tarih Seç:</span>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="dd.MM.yyyy"
                  placeholderText="Tarih seçiniz..."
                  inline
                  calendarStartDay={1}
                />
              </div>
              <button
                className="move-event-button"
                onClick={handleMoveEvent}
                disabled={!selectedDate}
              >
                Etkinliği Taşı
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventModal;
