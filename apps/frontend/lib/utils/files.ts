export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileName: string) => {
  if (fileName.endsWith('.pdf')) return 'vscode-icons:file-type-pdf2';
  if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'vscode-icons:file-type-word';
  return 'bxs:file-txt';
};
