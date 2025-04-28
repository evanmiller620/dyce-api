import { useEffect, useRef } from "react";
import { DateRange } from "react-date-range";

export const DatePicker = ({ range, setRange, show, setShow }) => {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginLeft: 'auto' }}>
      <button className="date-button" onClick={() => setShow(!show)}>
        {range[0].startDate.toLocaleDateString()} → {range[0].endDate.toLocaleDateString()}
      </button>
      {show && (
        <div className='calendar-wrapper' ref={ref}>
          <DateRange
            editableDateInputs={false}
            onChange={item => setRange([item.selection])}
            moveRangeOnFirstSelection={false}
            ranges={range}
            maxDate={new Date()}
          />
        </div>
      )}
    </div>
  )
}