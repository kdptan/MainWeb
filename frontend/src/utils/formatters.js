// Format age value with unit
export const formatAge = (value, unit) => {
  return `${value} ${unit}`;
};

// Format duration in minutes to readable format
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

// Convert hours to minutes
export const hoursToMinutes = (hours) => {
  return Math.round(hours * 60);
};

// Convert minutes to hours
export const minutesToHours = (minutes) => {
  return (minutes / 60).toFixed(2);
};
