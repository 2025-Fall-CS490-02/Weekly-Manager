import { useState, useMemo } from 'react';

export default function WeekNavigator({ tasks, onWeekChange }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek; // Adjust to get Monday as start of week
    return new Date(today.setDate(diff));
  });

  const getWeekDates = (startDate) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);
  
  const formatDateForTask = (date) => {
    return date.toISOString().split('T')[0];
  };

  const weekTasks = useMemo(() => {
    const weekStart = formatDateForTask(currentWeekStart);
    const weekEnd = formatDateForTask(weekDates[6]);
    
    return tasks.filter(task => {
      if (!task.date) return false;
      return task.date >= weekStart && task.date <= weekEnd;
    });
  }, [tasks, currentWeekStart, weekDates]);

  const navigateWeek = (direction) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newStart);
    
    if (onWeekChange) {
      onWeekChange(formatDateForTask(newStart), getWeekDates(newStart).map(formatDateForTask));
    }
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    const weekStart = new Date(today.setDate(diff));
    setCurrentWeekStart(weekStart);
    
    if (onWeekChange) {
      onWeekChange(formatDateForTask(weekStart), getWeekDates(weekStart).map(formatDateForTask));
    }
  };

  const getWeekHours = () => {
    return weekTasks.reduce((total, task) => {
      const start = new Date(`${task.date}T${task.startTime}`);
      const end = new Date(`${task.endDate || task.date}T${task.endTime}`);
      if (start && end) {
        return total + ((end - start) / (1000 * 60 * 60));
      }
      return total;
    }, 0);
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
    }
  };

  return (
    <div className="week-navigator" style={{ 
      background: '#f8f9fa', 
      padding: '20px', 
      borderRadius: '8px', 
      marginBottom: '20px',
      border: '1px solid #e9ecef'
    }}>
      {/* Week Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <button 
          type="button" 
          className="my-button" 
          onClick={() => navigateWeek(-1)}
          style={{ padding: '8px 12px' }}
        >
          ← Previous
        </button>
        
        <div style={{ textAlign: 'center', flex: 1, margin: '0 20px' }}>
          <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>
            Week of {formatWeekRange()}
          </h2>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>
            {weekTasks.length} tasks • {Math.round(getWeekHours() * 10) / 10}h scheduled
          </div>
        </div>
        
        <button 
          type="button" 
          className="my-button" 
          onClick={() => navigateWeek(1)}
          style={{ padding: '8px 12px' }}
        >
          Next →
        </button>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          type="button" 
          className="my-button" 
          onClick={goToCurrentWeek}
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          Current Week
        </button>
      </div>

      {/* Week Overview Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginTop: '15px' }}>
        {weekDates.map((date, index) => {
          const dateStr = formatDateForTask(date);
          const dayTasks = weekTasks.filter(t => t.date === dateStr);
          const dayHours = dayTasks.reduce((total, task) => {
            const start = new Date(`${task.date}T${task.startTime}`);
            const end = new Date(`${task.endDate || task.date}T${task.endTime}`);
            return total + ((end - start) / (1000 * 60 * 60));
          }, 0);
          
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          
          return (
            <div key={index} style={{
              textAlign: 'center',
              padding: '8px 4px',
              background: isToday ? '#007bff' : '#fff',
              color: isToday ? '#fff' : '#333',
              borderRadius: '4px',
              fontSize: '12px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ fontWeight: 'bold' }}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div>{date.getDate()}</div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                {dayTasks.length}t • {Math.round(dayHours * 10) / 10}h
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}