// weeklyReport.js - JavaScript version of your weekly report generator

/**
 * Generates a weekly report for tasks within a specific week
 * @param {Array} allTasks - Array of all tasks
 * @param {string} weekStartStr - Week start date in YYYY-MM-DD format
 * @returns {Object} Weekly report data
 */
export function generateWeeklyReport(allTasks, weekStartStr) {
  const weekStart = new Date(weekStartStr);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  console.log("Generating weekly report for:", weekStartStr, "to", formatDateForReport(weekEnd));
  console.log("All tasks:", allTasks);
  
  // Filter tasks that fall within the week (check if task starts, ends, or spans the week)
  const weekTasks = allTasks.filter(task => {
    if (!task.date) return false;
    
    const taskStart = new Date(task.date);
    const taskEnd = task.endDate ? new Date(task.endDate) : taskStart;
    
    // Task is in the week if it starts, ends, or spans any day in the week
    const taskInWeek = (taskStart <= weekEnd && taskEnd >= weekStart);
    
    if (taskInWeek) {
      console.log("Task in week:", task.event, "from", taskStart, "to", taskEnd);
    }
    
    return taskInWeek;
  });
  
  console.log("Filtered week tasks:", weekTasks);
  
  // Sort tasks by date and time
  const sortedTasks = weekTasks.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
    const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
    return dateA - dateB;
  });
  
  // Create day structure for the entire week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysOfWeek = [];
  
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(weekStart);
    currentDay.setDate(weekStart.getDate() + i);
    const dateStr = formatDateForReport(currentDay);
    const dayName = dayNames[currentDay.getDay()];
    
    // Find tasks for this specific day
    const dayTasks = sortedTasks.filter(task => {
      const taskDate = new Date(task.date);
      return taskDate.toDateString() === currentDay.toDateString();
    });
    
    // Calculate total duration for the day
    const totalDuration = dayTasks.reduce((sum, task) => sum + calculateTaskDuration(task), 0);
    
    daysOfWeek.push({
      date: dateStr,
      dayName,
      fullDate: new Date(currentDay),
      tasks: dayTasks.sort((a, b) => {
        // Sort tasks within the day by start time
        const timeA = a.startTime || '00:00';
        const timeB = b.startTime || '00:00';
        return timeA.localeCompare(timeB);
      }),
      totalDuration,
      taskCount: dayTasks.length
    });
  }
  
  // Calculate overall statistics
  const totalTasks = sortedTasks.length;
  const completedTasks = sortedTasks.filter(task => task.completed).length;
  const totalDuration = sortedTasks.reduce((sum, task) => sum + calculateTaskDuration(task), 0);
  const averageDailyDuration = totalTasks > 0 ? totalDuration / 7 : 0;
  
  // Find busiest day
  const busiestDay = daysOfWeek.reduce((prev, current) => 
    current.taskCount > prev.taskCount ? current : prev
  );
  
  // Calculate completion rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const report = {
    weekStart: formatDateForReport(weekStart),
    weekEnd: formatDateForReport(weekEnd),
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    daysOfWeek,
    totalTasks,
    completedTasks,
    totalDuration,
    averageDailyDuration,
    completionRate,
    busiestDay: busiestDay.taskCount > 0 ? busiestDay : null,
    weekTasks: sortedTasks // All tasks for the week
  };
  
  console.log("Generated report:", report);
  return report;
}

/**
 * Calculates the duration of a task in minutes
 * @param {Object} task - Task object with date, startTime, endDate, endTime
 * @returns {number} Duration in minutes
 */
function calculateTaskDuration(task) {
  try {
    const start = new Date(`${task.date}T${task.startTime}`);
    const end = new Date(`${task.endDate}T${task.endTime}`);
    const durationMs = end - start;
    return Math.max(0, Math.floor(durationMs / 60000)); // Convert to minutes
  } catch (error) {
    console.error('Error calculating task duration:', error);
    return 0;
  }
}

/**
 * Formats duration from minutes to human readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
}

/**
 * Formats a date for display in reports
 * @param {Date} date 
 * @returns {string}
 */
function formatDateForReport(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Gets the start of the week (Sunday) for a given date
 * @param {Date} date 
 * @returns {string} Week start date in YYYY-MM-DD format
 */
export function getWeekStart(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day; // Adjust to Sunday
  start.setDate(diff);
  
  // Format as YYYY-MM-DD
  const year = start.getFullYear();
  const month = String(start.getMonth() + 1).padStart(2, '0');
  const dayStr = String(start.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${dayStr}`;
}

/**
 * Formats time for display (12-hour format)
 * @param {string} time24 - Time in 24-hour format (HH:MM)
 * @returns {string} Time in 12-hour format
 */
export function formatTimeDisplay(time24) {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Gets a user-friendly date range description
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {string} Formatted date range
 */
export function getDateRangeText(startDate, endDate) {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  const startText = startDate.toLocaleDateString('en-US', options);
  const endText = endDate.toLocaleDateString('en-US', options);
  
  return `${startText} - ${endText}`;
}