import { useState } from 'react';
import api from '../api/axios';

export const useDragAndDrop = (items, setItems, onError, fetchItems) => {
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, item, index) => {
    setDraggedItem({ item, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    if (!draggedItem) return;
    e.preventDefault();
    
    const dragIndex = draggedItem.index;
    if (dragIndex === dropIndex) {
      setDraggedItem(null);
      return;
    }

    const newItems = [...items];
    const [removed] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, removed);
    
    setItems(newItems);
    setDraggedItem(null);

    try {
      const reorderedItems = newItems.map((item, idx) => ({
        id: item.id,
        type: item.type,
        display_order: idx
      }));
      await api.post('/api/folders/reorder', { items: reorderedItems });
    } catch (error) {
      console.error('Error saving order:', error);
      onError('Failed to save order');
      fetchItems();
    }
  };

  return {
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDrop
  };
};
