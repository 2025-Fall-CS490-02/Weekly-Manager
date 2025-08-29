// __tests__/icsParser.test.js
import { parseIcsFile } from '../utils/icsParser.js';

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: jest.fn(() => 'mock-uuid-123')
};

describe('ICS Parser', () => {
  test('parses basic ICS file correctly', () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VEVENT
UID:test-event-1
DTSTART:20241201T100000
DTEND:20241201T110000
SUMMARY:Test Meeting
DESCRIPTION:This is a test meeting
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsFile(icsContent);
    
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      id: 'mock-uuid-123',
      event: 'Test Meeting',
      description: 'This is a test meeting',
      date: '2024-12-01',
      startTime: '10:00',
      endDate: '2024-12-01',
      endTime: '11:00'
    });
  });

  test('handles UTC timestamps with Z suffix', () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20241201T100000Z
DTEND:20241201T110000Z
SUMMARY:UTC Event
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsFile(icsContent);
    
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('UTC Event');
    expect(events[0].date).toBe('2024-12-01');
  });

  test('handles all-day events', () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20241201
DTEND;VALUE=DATE:20241202
SUMMARY:All Day Event
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsFile(icsContent);
    
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('All Day Event');
    expect(events[0].startTime).toBe('00:00');
    expect(events[0].endTime).toBe('00:00');
  });

  test('handles multiple events', () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20241201T100000
DTEND:20241201T110000
SUMMARY:First Event
END:VEVENT
BEGIN:VEVENT
DTSTART:20241202T140000
DTEND:20241202T150000
SUMMARY:Second Event
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsFile(icsContent);
    
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('First Event');
    expect(events[1].event).toBe('Second Event');
  });

  test('handles line folding', () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20241201T100000
DTEND:20241201T110000
SUMMARY:This is a very long event title that spans
 multiple lines due to line folding
DESCRIPTION:This description also spans multiple lines
 and should be properly concatenated
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsFile(icsContent);
    
    expect(events).toHaveLength(1);
    expect(events[0].event).toContain('This is a very long event title');
    expect(events[0].description).toContain('This description also spans');
  });

  test('handles escaped characters', () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20241201T100000
DTEND:20241201T110000
SUMMARY:Event with\\, comma and\\; semicolon
DESCRIPTION:Description with\\nnew line
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsFile(icsContent);
    
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('Event with, comma and; semicolon');
    expect(events[0].description).toBe('Description with\nnew line');
  });

  test('skips incomplete events', () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20241201T100000
SUMMARY:Event without end time
END:VEVENT
BEGIN:VEVENT
DTSTART:20241202T100000
DTEND:20241202T110000
SUMMARY:Complete Event
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsFile(icsContent);
    
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('Complete Event');
  });

  test('handles empty ICS file', () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
END:VCALENDAR`;

    const events = parseIcsFile(icsContent);
    
    expect(events).toHaveLength(0);
  });

  test('throws error for invalid ICS content', () => {
    const invalidContent = 'This is not a valid ICS file';
    
    expect(() => {
      parseIcsFile(invalidContent);
    }).toThrow();
  });
});