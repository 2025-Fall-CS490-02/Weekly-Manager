import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatTimeDisplay } from './utils/weeklyReport.js';

// Safe date formatting function
function safeFormatDateRange(startDate, endDate, fallbackStart, fallbackEnd) {
  try {
    // Try to create Date objects if they aren't already
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return `${fallbackStart} - ${fallbackEnd}`;
    }
    
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const startText = start.toLocaleDateString('en-US', options);
    const endText = end.toLocaleDateString('en-US', options);
    
    return `${startText} - ${endText}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return `${fallbackStart} - ${fallbackEnd}`;
  }
}

function PrintPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedReport = localStorage.getItem('weeklyReportData');
      if (storedReport) {
        const data = JSON.parse(storedReport);
        console.log("Loaded report data:", data);
        setReportData(data);
      }
    } catch (error) {
      console.error('Error loading weekly report data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="print-page">
        <div className="print-header">
          <Link to="/" className="back-link">← Back to Tasks</Link>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading weekly report...
        </div>
      </div>
    );
  }

  if (!reportData || !reportData.daysOfWeek) {
    return (
      <div className="print-page">
        <div className="print-header">
          <Link to="/" className="back-link">← Back to Tasks</Link>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>No Report Data Available</h2>
          <p>Please generate a weekly report from the main page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="print-page">
      <div className="print-header no-print">
        <Link to="/" className="back-link">← Back to Tasks</Link>
        <button onClick={handlePrint} className="print-button">Print Report</button>
      </div>

      <div className="weekly-report">
        <header className="report-header">
          <h1>Weekly Schedule Report</h1>
          <h2>
            {safeFormatDateRange(
              reportData.weekStartDate, 
              reportData.weekEndDate, 
              reportData.weekStart, 
              reportData.weekEnd
            )}
          </h2>
          
          <div className="report-summary">
            <div className="summary-item">
              <div className="summary-number">{reportData.totalTasks}</div>
              <div className="summary-label">Total Events</div>
            </div>
            <div className="summary-item">
              <div className="summary-number">{reportData.completedTasks}</div>
              <div className="summary-label">Completed</div>
            </div>
            <div className="summary-item">
              <div className="summary-number">{reportData.completionRate}%</div>
              <div className="summary-label">Completion Rate</div>
            </div>
            <div className="summary-item">
              <div className="summary-number">{formatDuration(reportData.totalDuration)}</div>
              <div className="summary-label">Total Duration</div>
            </div>
            {reportData.busiestDay && (
              <div className="summary-item busiest">
                <div className="summary-number">{reportData.busiestDay.dayName}</div>
                <div className="summary-label">Busiest Day ({reportData.busiestDay.taskCount} events)</div>
              </div>
            )}
          </div>
        </header>

        <div className="weekly-calendar">
          {reportData.daysOfWeek.map((day, index) => (
            <div key={day.date} className={`calendar-day ${day.taskCount === 0 ? 'empty-day' : ''}`}>
              <div className="calendar-day-header">
                <div className="day-name">{day.dayName}</div>
                <div className="day-date">
                  {(() => {
                    try {
                      if (day.fullDate && day.fullDate.toLocaleDateString) {
                        return day.fullDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      } else {
                        // Try to create a date from the date string
                        const dateObj = new Date(day.date);
                        if (!isNaN(dateObj.getTime())) {
                          return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        } else {
                          return day.date;
                        }
                      }
                    } catch (error) {
                      return day.date;
                    }
                  })()}
                </div>
                {day.taskCount > 0 && (
                  <div className="day-stats">
                    <span className="task-count">{day.taskCount} event{day.taskCount !== 1 ? 's' : ''}</span>
                    {day.totalDuration > 0 && (
                      <span className="duration">• {formatDuration(day.totalDuration)}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="calendar-events">
                {day.tasks.length === 0 ? (
                  <div className="no-events">No events</div>
                ) : (
                  day.tasks.map((task, taskIndex) => (
                    <div key={task.id || taskIndex} className={`calendar-event ${task.completed ? 'completed' : ''}`}>
                      <div className="event-time">
                        {formatTimeDisplay(task.startTime)} - {formatTimeDisplay(task.endTime)}
                      </div>
                      <div className="event-title">{task.event}</div>
                      {task.description && (
                        <div className="event-description">{task.description}</div>
                      )}
                      <div className="event-status">
                        {task.completed ? '✅' : '⏳'}
                        <span className="event-duration">
                          {formatDuration(calculateTaskDurationFromTask(task))}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="report-insights">
          <h3>Weekly Insights</h3>
          <div className="insights-grid">
            <div className="insight-item">
              <strong>Most Active Day:</strong> 
              {reportData.busiestDay ? 
                `${reportData.busiestDay.dayName} with ${reportData.busiestDay.taskCount} events` :
                'No events scheduled'
              }
            </div>
            <div className="insight-item">
              <strong>Average Daily Events:</strong> 
              {Math.round((reportData.totalTasks / 7) * 10) / 10}
            </div>
            <div className="insight-item">
              <strong>Average Daily Duration:</strong> 
              {formatDuration(Math.round(reportData.averageDailyDuration))}
            </div>
            <div className="insight-item">
              <strong>Days with Events:</strong> 
              {reportData.daysOfWeek.filter(day => day.taskCount > 0).length} out of 7
            </div>
          </div>
        </div>

        <footer className="report-footer">
          <p>Report generated on {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </footer>
      </div>
    </div>
  );
}

// Helper function to calculate task duration
function calculateTaskDurationFromTask(task) {
  try {
    const start = new Date(`${task.date}T${task.startTime}`);
    const end = new Date(`${task.endDate}T${task.endTime}`);
    const durationMs = end - start;
    return Math.max(0, Math.floor(durationMs / 60000)); // Convert to minutes
  } catch (error) {
    return 0;
  }
}

export default PrintPage;