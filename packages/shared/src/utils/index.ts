export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const calculateDaysUntilDue = (dueDate: Date): number => {
  const now = new Date();
  const timeDiff = dueDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};
