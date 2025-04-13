// import { useState } from 'react';

// /**
//  * Date Range Picker Component
//  * Allows user to select start and end dates for historical weather data
//  */
// export default function DateRangePicker({ startDate, endDate, onRangeChange }) {
//   const [selectedStartDate, setSelectedStartDate] = useState(startDate);
//   const [selectedEndDate, setSelectedEndDate] = useState(endDate);
  
//   // Calculate min/max valid dates
//   const minDate = "2010-01-01"; // Assuming data starts from 2010
//   const maxDate = new Date().toISOString().split('T')[0]; // Today
  
//   // Handle date changes
//   const handleStartDateChange = (e) => {
//     const newStartDate = e.target.value;
//     setSelectedStartDate(newStartDate);
    
//     // Ensure end date is after start date
//     if (newStartDate > selectedEndDate) {
//       setSelectedEndDate(newStartDate);
//     }
//   };
  
//   const handleEndDateChange = (e) => {
//     const newEndDate = e.target.value;
//     setSelectedEndDate(newEndDate);
    
//     // Ensure start date is before end date
//     if (newEndDate < selectedStartDate) {
//       setSelectedStartDate(newEndDate);
//     }
//   };
  
//   // Apply button to trigger data fetch
//   const handleApply = () => {
//     onRangeChange(selectedStartDate, selectedEndDate);
//   };
  
//   // Quick select predefined periods
//   const quickSelect = (period) => {
//     const endDate = new Date().toISOString().split('T')[0]; // Today
//     let startDate;
    
//     switch (period) {
//       case 'last-month':
//         startDate = new Date();
//         startDate.setMonth(startDate.getMonth() - 1);
//         startDate = startDate.toISOString().split('T')[0];
//         break;
//       case 'last-3-months':
//         startDate = new Date();
//         startDate.setMonth(startDate.getMonth() - 3);
//         startDate = startDate.toISOString().split('T')[0];
//         break;
//       case 'last-6-months':
//         startDate = new Date();
//         startDate.setMonth(startDate.getMonth() - 6);
//         startDate = startDate.toISOString().split('T')[0];
//         break;
//       case 'last-year':
//         startDate = new Date();
//         startDate.setFullYear(startDate.getFullYear() - 1);
//         startDate = startDate.toISOString().split('T')[0];
//         break;
//       case 'last-5-years':
//         startDate = new Date();
//         startDate.setFullYear(startDate.getFullYear() - 5);
//         startDate = startDate.toISOString().split('T')[0];
//         break;
//       default:
//         return;
//     }
    
//     setSelectedStartDate(startDate);
//     setSelectedEndDate(endDate);
//     onRangeChange(startDate, endDate);
//   };
  
//   return (
//     <div style={{margin: 'auto'}}>
//       <label>Start Date</label>
//       <input
//         type="date"
//         className="form-control"
//         min={minDate}
//         max={maxDate}
//         value={selectedStartDate}
//         onChange={handleStartDateChange}
//       />
//       <label>End Date</label>
//       <input
//         type="date"
//         className="form-control"
//         min={minDate}
//         max={maxDate}
//         value={selectedEndDate}
//         onChange={handleEndDateChange}
//       />
//       {/* <P className="mb-3">Select time period for historical data</P> */}
//       <div>
//         <div className="d-flex justify-content-between align-items-center flex-wrap">
//           <div className="btn-group btn-group-sm mb-2 mb-md-0">
//             <button
//               className="btn btn-outline-secondary"
//               onClick={() => quickSelect('last-month')}
//             >
//               1 Month
//             </button>
//             <button
//               className="btn btn-outline-secondary"
//               onClick={() => quickSelect('last-3-months')}
//             >
//               3 Months
//             </button>
//             <button
//               className="btn btn-outline-secondary"
//               onClick={() => quickSelect('last-6-months')}
//             >
//               6 Months
//             </button>
//             <button
//               className="btn btn-outline-secondary"
//               onClick={() => quickSelect('last-year')}
//             >
//               1 Year
//             </button>
//             <button
//               className="btn btn-outline-secondary"
//               onClick={() => quickSelect('last-5-years')}
//             >
//               5 Years
//             </button>
//           </div>
          
//           <button
//             className="btn btn-primary"
//             onClick={handleApply}
//           >
//             Apply
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// } 