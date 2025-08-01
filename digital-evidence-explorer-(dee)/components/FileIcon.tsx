
import React from 'react';
import { ICONS } from '../constants';

interface FileIconProps {
  fileType: string;
  className?: string;
}

const FileIcon: React.FC<FileIconProps> = ({ fileType, className = 'w-6 h-6' }) => {
  let icon = ICONS.unknown;
  if (fileType.startsWith('image/')) {
    icon = ICONS.image;
  } else if (fileType.startsWith('video/')) {
    icon = ICONS.video;
  } else if (fileType === 'application/pdf') {
    icon = ICONS.pdf;
  } else if (fileType.includes('document')) {
    icon = ICONS.document;
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      {icon}
    </svg>
  );
};

export default FileIcon;
