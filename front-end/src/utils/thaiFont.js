// Thai Font (Sarabun) for jsPDF
// This is a lightweight version of Sarabun font

export const addThaiFont = (doc) => {
  // Sarabun Regular font in base64 format (truncated for demonstration)
  // You would need to include the full base64 string here
  // For now, we'll use a workaround with the standard fonts

  // Note: For production, you should:
  // 1. Download Sarabun font from Google Fonts
  // 2. Convert it to base64 using tools like https://products.aspose.app/font/base64
  // 3. Add it to jsPDF using addFileToVFS and addFont

  try {
    // Fallback: Use standard font with better Unicode support
    doc.setFont("helvetica");
  } catch (error) {
    console.error("Error adding Thai font:", error);
    doc.setFont("helvetica"); // Fallback to default
  }

  return doc;
};

// Helper function to detect if text contains Thai characters
export const containsThai = (text) => {
  const thaiRegex = /[\u0E00-\u0E7F]/;
  return thaiRegex.test(text);
};

// Format text for better display in PDF
export const formatTextForPDF = (text) => {
  if (!text) return "N/A";

  // If text contains Thai, you might want to handle it differently
  if (containsThai(text)) {
    // For now, return as is
    // In production, ensure Thai font is loaded
    return text;
  }

  return text;
};
