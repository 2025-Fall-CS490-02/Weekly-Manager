// __tests__/weeklyReport.test.js
import { generateWeeklyReport, formatDuration, getWeekStart, formatTimeDisplay } from '../utils/weeklyReport.js';

describe('Weekly Report Generator', () => {
  const mockTasks = [
    {
      id: '1',
      event: 'Monday Meeting',
      description: 'Team standup',
      date: '2024-12-02', // Monday
      startTime: '09:00',
      endDate: '2024-12-02',
      endTime: '10:00',
      completed: true
    },
    {
      id: '2',
      event: 'Wednesday Workshop',
      description: 'Training session',
      date: '2024-12-04', // Wednesday
      startTime: '14:00',
      endDate: '2024-12-04',
      endTime: '16:00',
      completed: false
    },
    {
      id: '3',
      event: 'Friday Review',
      description: 'Week review',
      date: '2024-12-06', // Friday
      startTime: '15:00',
      endDate: '2024-12-06',
      endTime: '16:30',
      completed: true
    }
  ];

  test('generates report for a week with tasks', () => {
    const weekStart = '2024-12-01'; // Sunday
    const report = generateWeeklyReport(mockTasks, weekStart);

    expect(report.totalTasks).toBe(3);
    expect(report.completedTasks).toBe(2);
    expect(report.completionRate).toBe(67); // 2/3 * 100 rounded
    expect(report.daysOfWeek).toHaveLength(7);
  });

  test('calculates correct daily task distribution', () => {
    const weekStart = '2024-12-01'; // Sunday
    const report = generateWeeklyReport(mockTasks, weekStart);

    // Check Monday (index 1)
    const monday = report.daysOfWeek[1];
    expect(monday.dayName).toBe('Monday');
    expect(monday.taskCount).toBe(1);
    expect(monday.tasks[0].event).toBe('Monday Meeting');

    // Check Tuesday (index 2) - should be empty
    const tuesday = report.daysOfWeek[2];
    expect(tuesday.dayName).toBe('Tuesday');
    expect(tuesday.taskCount).toBe(0);

    // Check Wednesday (index 3)
    const wednesday = report.daysOfWeek[3];
    expect(wednesday.dayName).toBe('Wednesday');
    expect(wednesday.taskCount).toBe(1);
    expect(wednesday.tasks[0].event).toBe('Wednesday Workshop');
  });

  test('identifies busiest day correctly', () => {
    const tasksWithBusyDay = [
      ...mockTasks,
      {
        id: '4',
        event: 'Monday Lunch',
        date: '2024-12-02',
        startTime: '12:00',
        endDate: '2024-12-02',
        endTime: '13:00',
        completed: false
      }
    ];

    const weekStart = '2024-12-01';
    const report = generateWeeklyReport(tasksWithBusyDay, weekStart);

    expect(report.busiestDay).toBeDefined();
    expect(report.busiestDay.dayName).toBe('Monday');
    expect(report.busiestDay.taskCount).toBe(2);
  });

  test('handles week with no tasks', () => {
    const weekStart = '2024-12-01';
    const report = generateWeeklyReport([], weekStart);

    expect(report.totalTasks).toBe(0);
    expect(report.completedTasks).toBe(0);
    expect(report.completionRate).toBe(0);
    expect(report.busiestDay).toBeNull();
    expect(report.daysOfWeek.every(day => day.taskCount === 0)).toBe(true);
  });

  test('filters tasks outside the week range', () => {
    const tasksWithOutsideWeek = [
      ...mockTasks,
      {
        id: '5',
        event: 'Next Week Task',
        date: '2024-12-09', // Next Monday
        startTime: '09:00',
        endDate: '2024-12-09',
        endTime: '10:00',
        completed: false
      }
    ];

    const weekStart = '2024-12-01';
    const report = generateWeeklyReport(tasksWithOutsideWeek, weekStart);

    expect(report.totalTasks).toBe(3); // Should not include next week's task
    expect(report.weekTasks.find(task => task.event === 'Next Week Task')).toBeUndefined();
  });

  test('sorts tasks within days by start time', () => {
    const tasksOnSameDay = [
      {
        id: '1',
        event: 'Late Morning Task',
        date: '2024-12-02',
        startTime: '11:00',
        endDate: '2024-12-02',
        endTime: '12:00',
        completed: false
      },
      {
        id: '2',
        event: 'Early Morning Task',
        date: '2024-12-02',
        startTime: '09:00',
        endDate: '2024-12-02',
        endTime: '10:00',
        completed: false
      }
    ];

    const weekStart = '2024-12-01';
    const report = generateWeeklyReport(tasksOnSameDay, weekStart);

    const monday = report.daysOfWeek[1];
    expect(monday.tasks[0].event).toBe('Early Morning Task');
    expect(monday.tasks[1].event).toBe('Late Morning Task');
  });
});

describe('Utility Functions', () => {
  test('formatDuration converts minutes correctly', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(30)).toBe('30m');
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(125)).toBe('2h 5m');
  });

  test('formatTimeDisplay converts to 12-hour format', () => {
    expect(formatTimeDisplay('09:00')).toBe('9:00 AM');
    expect(formatTimeDisplay('12:00')).toBe('12:00 PM');
    expect(formatTimeDisplay('13:30')).toBe('1:30 PM');
    expect(formatTimeDisplay('00:00')).toBe('12:00 AM');
    expect(formatTimeDisplay('23:45')).toBe('11:45 PM');
    expect(formatTimeDisplay('')).toBe('');
  });

  test('getWeekStart returns correct Sunday date', () => {
    // Test with a Wednesday (should return previous Sunday)
    const wednesday = new Date('2024-12-04');
    const weekStart = getWeekStart(wednesday);
    expect(weekStart).toBe('2024-12-01'); // Previous Sunday

    // Test with a Sunday (should return same date)
    const sunday = new Date('2024-12-01');
    const weekStartSame = getWeekStart(sunday);
    expect(weekStartSame).toBe('2024-12-01');
  });

  test('getWeekStart handles current date when no parameter provided', () => {
    const weekStart = getWeekStart();
    expect(typeof weekStart).toBe('string');
    expect(weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
  });
});