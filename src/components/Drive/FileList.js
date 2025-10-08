import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';

export default function FileList({ files, onShare }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>File Name</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files?.map(file => (
            <TableRow key={file?.id}>
              <TableCell>{file?.filename}</TableCell>
              <TableCell>
                <IconButton href={file?.downloadUrl} target="_blank">
                  <DownloadIcon />
                </IconButton>
                <IconButton onClick={() => onShare(file)}>
                  <ShareIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
} 