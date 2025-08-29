// icsParser.js - Improved JavaScript version with better error handling

/**
 * Parses an ICS file content and returns an array of calendar events
 * @param {string} fileContent - The content of the ICS file
 * @returns {Array} Array of parsed calendar events
 */
export function parseIcsFile(fileContent) {
  console.log("Starting ICS parsing...");
  console.log("File content preview:", fileContent.substring(0, 200));
  
  const events = [];
  
  try {
    // Clean and normalize the content
    const cleanContent = fileContent
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')    // Handle old Mac line endings
      .trim();
    
    // Split into lines and handle line folding (lines starting with space/tab continue previous line)
    const rawLines = cleanContent.split('\n');
    const lines = [];
    
    for (let i = 0; i < rawLines.length; i++) {
      let currentLine = rawLines[i].trim();
      
      // Handle line folding - if next line starts with space or tab, it continues this line
      while (i + 1 < rawLines.length && (rawLines[i + 1].startsWith(' ') || rawLines[i + 1].startsWith('\t'))) {
        i++;
        currentLine += rawLines[i].substring(1); // Remove the leading space/tab
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
    }
    
    console.log("Processed lines:", lines.length);
    console.log("First few lines:", lines.slice(0, 10));
    
    let currentEvent = {};
    let inEvent = false;
    let eventCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line === "BEGIN:VEVENT") {
        inEvent = true;
        currentEvent = {};
        console.log("Started parsing event", eventCount + 1);
      } 
      else if (line === "END:VEVENT" && inEvent) {
        console.log("Finished parsing event:", currentEvent);
        
        // Only add event if it has required fields
        if (currentEvent.title && currentEvent.start && currentEvent.end) {
          const parsedEvent = {
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            event: currentEvent.title,
            description: currentEvent.description || '',
            date: formatDateForInput(currentEvent.start),
            startTime: formatTimeForInput(currentEvent.start),
            endDate: formatDateForInput(currentEvent.end),
            endTime: formatTimeForInput(currentEvent.end)
          };
          
          console.log("Adding parsed event:", parsedEvent);
          events.push(parsedEvent);
          eventCount++;
        } else {
          console.warn("Skipping incomplete event:", currentEvent);
        }
        
        inEvent = false;
      }
      else if (inEvent) {
        // Parse event properties
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;
        
        const property = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);
        
        // Handle different property formats
        if (property === "SUMMARY") {
          currentEvent.title = cleanValue(value);
        }
        else if (property === "DESCRIPTION") {
          currentEvent.description = cleanValue(value);
        }
        else if (property.startsWith("DTSTART")) {
          currentEvent.start = parseIcsDate(value);
        }
        else if (property.startsWith("DTEND")) {
          currentEvent.end = parseIcsDate(value);
        }
        // Handle alternative time properties
        else if (property === "DTSTART;VALUE=DATE") {
          currentEvent.start = parseIcsDate(value, true); // All-day event
        }
        else if (property === "DTEND;VALUE=DATE") {
          currentEvent.end = parseIcsDate(value, true); // All-day event
        }
      }
    }
    
    console.log(`Successfully parsed ${events.length} events from ICS file`);
    return events;
    
  } catch (error) {
    console.error("Detailed parsing error:", error);
    console.error("Error stack:", error.stack);
    throw new Error(`ICS parsing failed: ${error.message}`);
  }
}

/**
 * Cleans ICS value by removing escape sequences and unwrapping text
 * @param {string} value - Raw ICS property value
 * @returns {string} Cleaned value
 */
function cleanValue(value) {
  return value
    .replace(/\\n/g, '\n')      // Unescape newlines
    .replace(/\\,/g, ',')       // Unescape commas
    .replace(/\\;/g, ';')       // Unescape semicolons
    .replace(/\\\\/g, '\\')     // Unescape backslashes
    .trim();
}

/**
 * Parses ICS date format and returns a JavaScript Date object
 * @param {string} value - ICS date string
 * @param {boolean} isAllDay - Whether this is an all-day event
 * @returns {Date} Parsed date
 */
function parseIcsDate(value, isAllDay = false) {
  try {
    console.log("Parsing date:", value, "All-day:", isAllDay);
    
    // Remove any timezone info for now (basic implementation)
    const cleanValue = value.split(';')[0];
    
    // Case 1: All-day events (just date, no time)
    if (isAllDay || (!cleanValue.includes('T') && cleanValue.length === 8)) {
      const year = parseInt(cleanValue.substring(0, 4));
      const month = parseInt(cleanValue.substring(4, 6)) - 1; // Month is 0-indexed
      const day = parseInt(cleanValue.substring(6, 8));
      
      const date = new Date(year, month, day, 0, 0, 0);
      console.log("Parsed all-day date:", date);
      return date;
    }
    
    // Case 2: UTC format (with 'Z')
    if (cleanValue.endsWith("Z")) {
      const year = parseInt(cleanValue.substring(0, 4));
      const month = parseInt(cleanValue.substring(4, 6)) - 1;
      const day = parseInt(cleanValue.substring(6, 8));
      const hour = parseInt(cleanValue.substring(9, 11));
      const minute = parseInt(cleanValue.substring(11, 13));
      const second = parseInt(cleanValue.substring(13, 15) || "0");
      
      // Create UTC date and convert to local time
      const utcDate = new Date(Date.UTC(year, month, day, hour, minute, second));
      console.log("Parsed UTC date:", utcDate);
      return utcDate;
    }
    
    // Case 3: Full datetime without 'Z' (local time)
    else if (cleanValue.includes("T")) {
      const year = parseInt(cleanValue.substring(0, 4));
      const month = parseInt(cleanValue.substring(4, 6)) - 1;
      const day = parseInt(cleanValue.substring(6, 8));
      const hour = parseInt(cleanValue.substring(9, 11));
      const minute = parseInt(cleanValue.substring(11, 13));
      const second = parseInt(cleanValue.substring(13, 15) || "0");
      
      const date = new Date(year, month, day, hour, minute, second);
      console.log("Parsed local date:", date);
      return date;
    }
    
    // Case 4: Date only (YYYYMMDD format)
    else if (cleanValue.length >= 8) {
      const year = parseInt(cleanValue.substring(0, 4));
      const month = parseInt(cleanValue.substring(4, 6)) - 1;
      const day = parseInt(cleanValue.substring(6, 8));
      
      const date = new Date(year, month, day, 0, 0, 0);
      console.log("Parsed date-only:", date);
      return date;
    }
    
    throw new Error(`Unrecognized date format: ${cleanValue}`);
    
  } catch (error) {
    console.error("Date parsing error for value:", value, error);
    // Return current date as fallback
    return new Date();
  }
}

/**
 * Formats a Date object to YYYY-MM-DD string for HTML date input
 * @param {Date} date 
 * @returns {string}
 */
function formatDateForInput(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn("Invalid date for formatting:", date);
    return new Date().toISOString().split('T')[0]; // Return today's date as fallback
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object to HH:MM string for HTML time input
 * @param {Date} date 
 * @returns {string}
 */
function formatTimeForInput(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.warn("Invalid date for time formatting:", date);
    return "00:00"; // Return midnight as fallback
  }
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}