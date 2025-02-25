import { Drawer } from '@mui/material';
import { useState } from 'react';
import { useDnD } from '../../contex/DNDContext';


const SideBar = () => {
  const [_, setType] = useDnD();
  const [isOpen, setIsOpen] = useState(false);


  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    if (setType) {
      setType(nodeType);
    }
    event.dataTransfer.effectAllowed = 'move';
  };



  const toggleOpen = () => {
    console.log('toggleOpen', isOpen);
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        onClick={toggleOpen}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50
          bg-white shadow-md rounded-l-lg p-3 hover:bg-gray-50 transition-all duration-300
          ${isOpen ? 'right-[320px]' : 'right-0'}`}
      >
        {isOpen ? '×' : '◄'}
      </button>
      <Drawer
        anchor="right"
        open={isOpen}
        hideBackdrop={true}
        variant="persistent"
        sx={{
          '& .MuiDrawer-paper': {
            width: 320,
            boxSizing: 'border-box',
          },
        }}
        SlideProps={{
          timeout: 300
        }}
      >
        <div className="h-full bg-white p-4 space-y-4">
          <div
            className="dndnode rounded-lg border-2 border-blue-400 bg-blue-50 p-3 cursor-move hover:shadow-md hover:bg-blue-100 transition-all"
            onDragStart={(event) => onDragStart(event, 'input')}
            draggable
          >
            <div className="text-blue-700 font-medium">Input Node</div>
            <div className="text-xs text-blue-500 mt-1">Data Source</div>
          </div>

          <div
            className="dndnode rounded-lg border-2 border-purple-400 bg-purple-50 p-3 cursor-move hover:shadow-md hover:bg-purple-100 transition-all"
            onDragStart={(event) => onDragStart(event, 'default')}
            draggable
          >
            <div className="text-purple-700 font-medium">Processing Node</div>
            <div className="text-xs text-purple-500 mt-1">Data Transformation</div>
          </div>

          <div
            className="dndnode output rounded-lg border-2 border-green-400 bg-green-50 p-3 cursor-move hover:shadow-md hover:bg-green-100 transition-all"
            onDragStart={(event) => onDragStart(event, 'output')}
            draggable
          >
            <div className="text-green-700 font-medium">Output Node</div>
            <div className="text-xs text-green-500 mt-1">Result Endpoint</div>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default SideBar;
