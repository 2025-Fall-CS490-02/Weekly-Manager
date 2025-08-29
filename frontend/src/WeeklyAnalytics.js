import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function WeeklyAnalytics({ tasks, weekStart }) {
  
  const parseLocalDateTime = (yyyyMmDd, hhmm) => {
    if (!yyyyMmDd) return null;
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    const [hh, mm] = (hhmm || '').split(':').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  };

  const getTaskHours = (task) => {
    const start = parseLocalDateTime(task.date, task.startTime);
    const end = parseLocalDateTime(task.endDate || task.date, task.endTime);
    if (!start || !end) return 0;
    return Math.max(0, (end - start) / (1000 * 60 * 60)); // Convert to hours
  };

  const analytics = useMemo(() => {
    if (!tasks.length) return { dailyHours: [], categoryBreakdown: [], totalHours: 0, averageTaskLength: 0 };

    // Calculate daily hours
    const dailyMap = new Map();
    const categoryMap = new Map();
    let totalHours = 0;

    tasks.forEach(task => {
      const hours = getTaskHours(task);
      totalHours += hours;

      // Daily breakdown
      const dateKey = task.date;
      if (dateKey) {
        const current = dailyMap.get(dateKey) || 0;
        dailyMap.set(dateKey, current + hours);
      }

      // Category breakdown (extract from event name or description)
      const category = extractCategory(task.event, task.description);
      const catCurrent = categoryMap.get(category) || 0;
      categoryMap.set(category, catCurrent + hours);
    });

    // Convert to chart data
    const dailyHours = Array.from(dailyMap.entries())
      .map(([date, hours]) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        hours: Math.round(hours * 10) / 10
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, hours]) => ({
        category,
        hours: Math.round(hours * 10) / 10,
        percentage: Math.round((hours / totalHours) * 100)
      }))
      .sort((a, b) => b.hours - a.hours);

    return {
      dailyHours,
      categoryBreakdown,
      totalHours: Math.round(totalHours * 10) / 10,
      averageTaskLength: Math.round((totalHours / tasks.length) * 10) / 10,
      taskCount: tasks.length
    };
  }, [tasks]);

  const extractCategory = (event, description) => {
    const text = `${event} ${description || ''}`.toLowerCase();
    
    // Simple category detection
    if (text.includes('meeting') || text.includes('call')) return 'Meetings';
    if (text.includes('study') || text.includes('homework') || text.includes('assignment')) return 'Study';
    if (text.includes('work') || text.includes('project')) return 'Work';
    if (text.includes('exercise') || text.includes('gym') || text.includes('workout')) return 'Exercise';
    if (text.includes('class') || text.includes('lecture')) return 'Classes';
    if (text.includes('personal') || text.includes('break') || text.includes('lunch')) return 'Personal';
    
    return 'Other';
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  if (!tasks.length) {
    return (
      <div className="analytics-container" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Weekly Analytics</h2>
        <p>No tasks to analyze</p>
      </div>
    );
  }

  return (
    <div className="analytics-container" style={{ padding: '20px' }}>
      <h2>Weekly Analytics Report</h2>
      
      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="stat-card" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{analytics.totalHours}h</div>
          <div style={{ color: '#7f8c8d', fontSize: '14px' }}>Total Hours Scheduled</div>
        </div>
        <div className="stat-card" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{analytics.taskCount}</div>
          <div style={{ color: '#7f8c8d', fontSize: '14px' }}>Total Tasks</div>
        </div>
        <div className="stat-card" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{analytics.averageTaskLength}h</div>
          <div style={{ color: '#7f8c8d', fontSize: '14px' }}>Average Task Length</div>
        </div>
      </div>

      {/* Daily Hours Chart */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Daily Time Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.dailyHours} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value}h`, 'Hours']} />
            <Bar dataKey="hours" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div>
          <h3>Time by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.categoryBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="hours"
                label={({ category, percentage }) => `${category} (${percentage}%)`}
              >
                {analytics.categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}h`, 'Hours']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3>Category Details</h3>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {analytics.categoryBreakdown.map((cat, index) => (
              <div key={cat.category} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '8px 12px',
                margin: '4px 0',
                background: '#f8f9fa',
                borderRadius: '4px',
                borderLeft: `4px solid ${COLORS[index % COLORS.length]}`
              }}>
                <span>{cat.category}</span>
                <span style={{ fontWeight: 'bold' }}>{cat.hours}h ({cat.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Productivity Insights */}
      <div style={{ marginTop: '30px', padding: '15px', background: '#e8f5e8', borderRadius: '8px' }}>
        <h3>Weekly Insights</h3>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Your busiest day had {Math.max(...analytics.dailyHours.map(d => d.hours))}h scheduled</li>
          <li>Most time spent on: {analytics.categoryBreakdown[0]?.category} ({analytics.categoryBreakdown[0]?.hours}h)</li>
          <li>Average {analytics.averageTaskLength}h per task - {analytics.averageTaskLength > 2 ? 'consider breaking large tasks into smaller ones' : 'good task sizing'}</li>
          {analytics.totalHours > 40 && <li style={{ color: '#e74c3c' }}>⚠️ Heavy schedule - ensure you're taking breaks</li>}
        </ul>
      </div>
    </div>
  );
}