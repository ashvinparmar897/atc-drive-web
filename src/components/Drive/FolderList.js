import React from 'react';
import { List, ListItem, ListItemButton, ListItemText } from '@mui/material';

export default function FolderList({ folders, selected, onSelect }) {
  return (
    <List>
      {folders.map(folder => (
        <ListItem key={folder.id} disablePadding>
          <ListItemButton selected={selected && selected.id === folder.id} onClick={() => onSelect(folder)}>
            <ListItemText primary={folder.name} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
} 