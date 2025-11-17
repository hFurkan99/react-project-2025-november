import type { FC } from "react";

type Staff = {
  id: string;
  name: string;
};

type ShiftLegendItem = {
  name: string;
  gradient: string;
};

type Props = {
  selectedStaff: Staff;
  shiftLegend?: ShiftLegendItem[];
};

const SelectedStaffHeader: FC<Props> = ({
  selectedStaff,
  shiftLegend = [],
}) => {
  return (
    <div className="selected-staff-header">
      <div className="staff-info">
        <h3>{selectedStaff.name}</h3>
        <p>Personel Takvimi</p>
      </div>

      {shiftLegend.length > 0 && (
        <div className="shift-legend">
          <h4>Vardiya Renkleri</h4>
          <div className="legend-items">
            {shiftLegend.map((shift, index) => (
              <div key={index} className="legend-item">
                <div
                  className="legend-color"
                  style={{ background: shift.gradient }}
                />
                <span>{shift.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectedStaffHeader;
