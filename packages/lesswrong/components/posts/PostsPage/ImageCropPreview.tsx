import React, { useState, useCallback, useEffect } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useImageContext, ReviewWinnerImageInfo } from './ImageContext';
import { useEventListener } from '../../hooks/useEventListener';
import { useCreate } from '../../../lib/crud/withCreate';
import { useUpdate } from '../../../lib/crud/withUpdate';

const initialHeight = 480;
const initialWidth = 360 * 3;
const aspectRatio = initialHeight / initialWidth;

type Coordinates = {
  x: number,
  y: number,
  width: number,
  height: number,
}

type BoxSubContainers = {
  left: Coordinates | null,
  middle: Coordinates | null,
  right: Coordinates | null,
};

const styles = (theme: ThemeType) => ({
    button: {
        padding: '10px 20px',
        cursor: 'pointer',
        backgroundColor: theme.palette.panelBackground.reviewGold,
        color: 'white',
        borderRadius: '4px',
        fontSize: '1rem',
    },
    overlay: {
        position: 'fixed',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10000,
        // background: 'rgba(0, 0, 0, 0.7)'
    },
    moveableBox: { 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-around',
        marginBottom: '40px', 
        position: 'absolute',
        background: 'transparent',
        border: '2px solid white',
        cursor: 'move',
        zIndex: 20000,
    },
    closeButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        cursor: 'pointer',
        padding: '2px 5px',
        userSelect: 'none', // Prevent text selection
        color: 'black',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        fontSize: '1rem',
    },
    resizer: {
      width: '10px',
      height: '10px',
      position: 'absolute',
      bottom: 0,
      right: 0,
      cursor: 'nwse-resize',
      backgroundColor: '#fff',
      border: '1px solid #000',
    },
    saveCoordinates: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      cursor: 'pointer',
      padding: '2px 5px',
      userSelect: 'none', // Prevent text selection
      color: 'black',
      fontSize: '1rem',
    },
    saveAllCoordinates: {
      position: 'absolute',
      display: 'block',
      bottom: 0,
      left: 0,
      width: '100%',
      cursor: 'pointer',
      padding: '2px 5px',
      userSelect: 'none', // Prevent text selection
      color: 'black',
      fontSize: '1rem',
    },
    successNotification: {
      position: 'absolute',
      display: 'block',
      width: '100%',
      cursor: 'pointer',
      padding: '2px 5px',
      userSelect: 'none', // Prevent text selection
      color: 'black',
      fontSize: '1rem',
      backgroundColor: 'rgba(0, 255, 0, 0.7)',
      textAlign: 'center',
    },
  });

export type SubBoxPosition = "left" | "middle" | "right";

export const ImagePreviewSubset = ({ reviewWinner, boxCoordinates, selectedImageInfo, subBoxPosition, selectedBox, setSelectedBox, cachedBoxCoordinates, setCachedBoxCoordinates, classes }: {
    reviewWinner: ReviewWinnerAll,
    boxCoordinates: Coordinates,
    selectedImageInfo: ReviewWinnerImageInfo,
    subBoxPosition: SubBoxPosition,
    selectedBox: SubBoxPosition | null,
    setSelectedBox: React.Dispatch<React.SetStateAction<SubBoxPosition | null>>,
    cachedBoxCoordinates: Record<string, BoxSubContainers>,
    setCachedBoxCoordinates: React.Dispatch<React.SetStateAction<Record<string, BoxSubContainers>>>,
    classes: ClassesType<typeof styles>
  }) => {
  
      // Update the style of each boxSub based on the selected box
  const handleBoxClick = (subBox: SubBoxPosition) => {
    setSelectedBox(subBox);
  };

  const cacheCoordinates = useCallback(async () => {

    const subBoxX = boxCoordinates.x + ((boxCoordinates.width / 3) * (subBoxPosition === "left" ? 0 : subBoxPosition === "middle" ? 1 : 2));
    const subBoxY = boxCoordinates.y;

    setCachedBoxCoordinates((prev) => {
      return {
        ...prev,
        [selectedImageInfo.imageId]: {
          ...prev[selectedImageInfo.imageId],
          [subBoxPosition]: {
            x: subBoxX,
            y: subBoxY,
            width: boxCoordinates.width / 3,
            height: boxCoordinates.height,
          }
        }
      }
    })
  }, [setCachedBoxCoordinates, subBoxPosition, boxCoordinates, selectedImageInfo]);

    const subBoxStyle = {
      width: boxCoordinates.width / 3,
      height: boxCoordinates.height,
      background: selectedBox === subBoxPosition ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.3)',
      borderLeft: '1px solid white',
      borderRight: '1px solid white',
    };

    const saveCoordinatesStyle = {
      bottom: 0,
      left: `${(boxCoordinates.width / 3) * (subBoxPosition === "left" ? 0 : subBoxPosition === "middle" ? 1 : 2)}px`,
      cursor: 'pointer',
      padding: '2px 5px',
      color: 'black',
      fontSize: '1rem',
    };

    // this will become a hoverover tooltip that previews the relevant image snippet
    const cachedBoxStyle = {
      position: 'absolute',
      width: '20px',
      height: '20px',
      backgroundColor: (cachedBoxCoordinates[selectedImageInfo.imageId] && cachedBoxCoordinates[selectedImageInfo.imageId][subBoxPosition]) ? 'green' : 'red'
    } as const;

    return (<>
      <div style={subBoxStyle} onClick={() => handleBoxClick(subBoxPosition)}>
      <div style={saveCoordinatesStyle} onClick={cacheCoordinates}>{`Save ${subBoxPosition} placement`}</div>
      <div style={cachedBoxStyle}></div>
      </div>
    </>)
  }

export const ImageCropPreview = ({ reviewWinner, classes }: {
    reviewWinner: ReviewWinnerAll,
    classes: ClassesType<typeof styles>
  }) => {

  const [isBoxVisible, setIsBoxVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const initialBoxCoordinates: Coordinates = {x: 100, y: 100, width: initialWidth, height: initialHeight}
  const [boxCoordinates, setBoxCoordinates] = useState(initialBoxCoordinates);

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); 

  const initialResizeInitialBoxCoordinates: Coordinates = {x: 100, y: 100, width: initialWidth, height: initialHeight}
  const [resizeInitialBoxCoordinates, setResizeInitialBoxCoordinates] = useState(initialResizeInitialBoxCoordinates);

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const {selectedImageInfo} = useImageContext();

  const initialCachedCoordinates: Record<string, BoxSubContainers> = {} 
  const [cachedBoxCoordinates, setCachedBoxCoordinates] = useState(initialCachedCoordinates);

  const startDragging = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent triggering drag when clicking the close button or the resize button
    if ((e.target as HTMLElement).className.includes('resizer') || (e.target as HTMLElement).className.includes('closeButton')) {
      return;
    }
    setIsDragging(true);
    setDragOffset({
        x: e.clientX - boxCoordinates.x,
        y: e.clientY - boxCoordinates.y,
      });
  };

  const startResizing = (e: React.MouseEvent<HTMLDivElement>) => {
    setResizeInitialBoxCoordinates({ x: e.clientX, y: e.clientY, width: boxCoordinates.width, height: boxCoordinates.height });
    setIsResizing(true);

  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).className.includes('resizer')) {
      startResizing(e);
    } else {
      startDragging(e);
    }
  };

  const endMouseDown = () => {
    setIsDragging(false);
    setIsResizing(false);
  }

  const moveBox = (e: MouseEvent) => {
    setBoxCoordinates({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
      width: boxCoordinates.width,
      height: boxCoordinates.height,
    });
  };

  const resizeBox = (e: MouseEvent) => {
    const additionalWidth = e.clientX - resizeInitialBoxCoordinates.x;
    const newWidth = resizeInitialBoxCoordinates.width + additionalWidth;
    const newHeight = newWidth * aspectRatio;

    setBoxCoordinates({ x: boxCoordinates.x, y: boxCoordinates.y, width: newWidth, height: newHeight });
  };

  const handleBox = (e: MouseEvent) => {
    if (isDragging && !isResizing) moveBox(e);
    if (isResizing) resizeBox(e);
  }

  const updateWindowSize = () => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  };

  useEventListener('resize', updateWindowSize);
  useEventListener('mousemove', handleBox);
  useEventListener('mouseup', endMouseDown);

  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean | null>(null);

  const { create: createSplashArtCoordinateMutation, loading, error } = useCreate({
    collectionName: 'SplashArtCoordinates',
    fragmentName: 'SplashArtCoordinates'
  });

  const {mutate: updateReviewWinner, error: updateRWError} = useUpdate({
    collectionName: "ReviewWinners",
    fragmentName: 'ReviewWinnerAll',
  });

  const saveAllCoordinates = useCallback(async () => {
  
    console.log('Attempting to save coordinates');

    try {
      if (!selectedImageInfo?.imageId) {
        // add a better error message for client
        console.error('No image id provided');
        setShowSaveSuccess(false); // Set failure state
        return;
      }

      const splashArtData = {
        reviewWinnerArtId: selectedImageInfo?.imageId,
        xCoordinate: boxCoordinates.x,
        yCoordinate: boxCoordinates.y,
        width: boxCoordinates.width,
        height: boxCoordinates.height,
        logTime: new Date(),
      };
  
      const response = await createSplashArtCoordinateMutation({ data: splashArtData });

      await updateReviewWinner({
        selector: {_id: reviewWinner?._id},
        data: {
          splashArtCoordinateId: response.data?.createSplashArtCoordinate.data._id 
        }
      })

      if (updateRWError) {
        console.error('Error updating review winner', updateRWError);
        setShowSaveSuccess(false); // Set failure state
        return;
      }

      setShowSaveSuccess(true); // might want to see if we actually succeeded somehow before setting this
    }
    catch (error) {
      console.error('Error saving coordinates', error);
      setShowSaveSuccess(false); // Set failure state
    }
  }, [updateReviewWinner, updateRWError, reviewWinner, boxCoordinates, selectedImageInfo, createSplashArtCoordinateMutation]);


  const moveableBoxStyle = {
    left: boxCoordinates.x,
    top: boxCoordinates.y,
    backgroundImage: `url(${selectedImageInfo?.splashArtImageUrl})`, 
    backgroundPosition: `-${boxCoordinates.x}px -${boxCoordinates.y}px`, // Set the background position based on boxPosition
    backgroundSize: `${windowSize.width}px auto`, // Ensure the background image covers the entire screen     
    width: boxCoordinates.width,
    height: boxCoordinates.height,             
  };
  // log percentages  !!!
  // render image as an image instead of css property

  // Add a state to track the selected box
  const [selectedBox, setSelectedBox] = useState<SubBoxPosition | null>(null);

  const boxSubContainers = {
    display: 'flex',
    justifyContent: 'space-around',
  };

  const showSaveAllButton = (selectedImageInfo && 
    cachedBoxCoordinates[selectedImageInfo.imageId] && 
    cachedBoxCoordinates[selectedImageInfo.imageId]["left"] && 
    cachedBoxCoordinates[selectedImageInfo.imageId]["middle"] && 
    cachedBoxCoordinates[selectedImageInfo.imageId]["right"]) 

  console.log('showSaveAllButton', showSaveAllButton);

  return (
    <>
      <button className={classes.button} onClick={() => setIsBoxVisible(!isBoxVisible)}>Show Box</button>
      {isBoxVisible && selectedImageInfo && selectedImageInfo.imageId && (
        <>
        <div className={classes.overlay}></div>
        <div className={classes.moveableBox}
            style={moveableBoxStyle}
            onMouseDown={handleMouseDown}>
            <div style={boxSubContainers}>
              <ImagePreviewSubset reviewWinner={reviewWinner} boxCoordinates={boxCoordinates} selectedImageInfo={selectedImageInfo} subBoxPosition={"left"} selectedBox={selectedBox} setSelectedBox={setSelectedBox} cachedBoxCoordinates={cachedBoxCoordinates} setCachedBoxCoordinates={setCachedBoxCoordinates} classes={classes} />
              <ImagePreviewSubset reviewWinner={reviewWinner} boxCoordinates={boxCoordinates} selectedImageInfo={selectedImageInfo} subBoxPosition={"middle"} selectedBox={selectedBox} setSelectedBox={setSelectedBox} cachedBoxCoordinates={cachedBoxCoordinates} setCachedBoxCoordinates={setCachedBoxCoordinates} classes={classes} />
              <ImagePreviewSubset reviewWinner={reviewWinner} boxCoordinates={boxCoordinates} selectedImageInfo={selectedImageInfo} subBoxPosition={"right"} selectedBox={selectedBox} setSelectedBox={setSelectedBox} cachedBoxCoordinates={cachedBoxCoordinates} setCachedBoxCoordinates={setCachedBoxCoordinates} classes={classes} />
            </div>
            <div className={classes.saveAllCoordinates} onClick={saveAllCoordinates}
                  style={{backgroundColor: showSaveAllButton ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.3)'}}>
              {!showSaveAllButton ? (<div> Must set all placements before you can save them </div>)
                : loading ? <div>Saving all placements...</div> 
                : <div onClick={saveAllCoordinates}>{`Save all placements`}</div>}
              {error && <div>Error saving. Please try again.</div>}
            </div>
            {showSaveSuccess && <div className={classes.successNotification}>Coordinates saved successfully!<div onClick={() => setShowSaveSuccess(false)}>(click here to close)</div></div>}
            <div className={classes.closeButton} onClick={() => setIsBoxVisible(false)}>
                x
            </div>
            <div
                className={classes.resizer}
                onMouseDown={handleMouseDown}
            ></div>
        </div>
        </>
      )}
    </>
  );
};

const ImageCropPreviewComponent = registerComponent('ImageCropPreview', ImageCropPreview, {styles});

declare global {
  interface ComponentTypes {
    ImageCropPreview: typeof ImageCropPreviewComponent
  }
}
