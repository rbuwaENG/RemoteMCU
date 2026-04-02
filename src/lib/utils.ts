export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const result = document.execCommand("copy");
    document.body.removeChild(textArea);
    return result;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
};

export const formatDate = (date: any): string => {
  if (!date) return "N/A";
  if (date.toDate) return date.toDate().toLocaleDateString();
  return new Date(date).toLocaleDateString();
};

export const formatDateTime = (date: any): string => {
  if (!date) return "N/A";
  if (date.toDate) return date.toDate().toLocaleString();
  return new Date(date).toLocaleString();
};

export const formatRelativeTime = (date: any): string => {
  if (!date) return "Never";
  const now = date.toDate ? date.toDate() : new Date(date);
  const diffMs = Date.now() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return now.toLocaleDateString();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};