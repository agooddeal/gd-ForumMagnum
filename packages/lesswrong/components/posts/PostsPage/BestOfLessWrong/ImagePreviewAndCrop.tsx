import React, { useState, useRef, RefObject } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useHover } from '@/components/common/withHover';
import { Coordinates } from '../ImageCropPreview';
import { useImageContext } from '../ImageContext';
const styles = defineStyles("ImagePreviewAndCrop", (theme: ThemeType) => ({ 
  rightSectionBelowBottomRow: {
    position: 'absolute',
    top: 200,
    right: 25,
    display: 'flex',
    flexDirection: 'row-reverse',
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 8,
    zIndex: 2,
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  changeImageBox: {
    ...theme.typography.commentStyle,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: theme.palette.panelBackground.reviewGold,
    color: theme.palette.text.alwaysWhite,
    cursor: 'pointer',
    marginBottom: 8,
    opacity: 0.3,
    '&:hover': {
      opacity: 1
    }
  },
}));

export const ImagePreviewAndCrop = ({ imgRef, imageFlipped, setImageFlipped, post }: { imgRef: RefObject<HTMLImageElement>, imageFlipped: boolean, setImageFlipped: (imageFlipped: boolean) => void, post: PostsWithNavigation|PostsWithNavigationAndRevision}) => {
  const classes = useStyles(styles);
  const { SplashHeaderImageOptions, ImageCropPreview, LWPopper } = Components;

  const { anchorEl, hover, eventHandlers } = useHover();

  const [cropPreviewEnabled, setCropPreviewEnabled] = useState(false);
  const toggleImageFlip = () => setImageFlipped(!imageFlipped);

  const backgroundImgWrapperRef = useRef<HTMLDivElement>(null);
  const backgroundImgCropPreviewRef = useRef<HTMLDivElement>(null);

  const setCropPreview = (coordinates?: Coordinates) => {
    if (imgRef.current && backgroundImgWrapperRef.current && backgroundImgCropPreviewRef.current) {
      if (coordinates) {
        const updatedMask = `
          linear-gradient(#000 0 0) ${coordinates.x}px ${coordinates.y}px/${coordinates.width}px ${coordinates.height}px,
          linear-gradient(rgba(0,0,0,0.4) 0 0)
        `;
        imgRef.current.style.mask = `${updatedMask} no-repeat`;
        imgRef.current.style.webkitMask = updatedMask;
        imgRef.current.style.webkitMaskRepeat = 'no-repeat';

        setCropPreviewEnabled(true);
      } else {
        imgRef.current.style.mask = '';
        imgRef.current.style.webkitMask = '';
        imgRef.current.style.webkitMaskRepeat = '';

        setCropPreviewEnabled(false);
      }
    }
  };


  return <div className={classes.rightSectionBelowBottomRow}>
    <div {...eventHandlers}>
      <div className={classes.changeImageBox}>Change image</div>
      <div className={classes.changeImageBox} onClick={toggleImageFlip}>Flip image</div>
      <LWPopper open={hover} anchorEl={anchorEl} placement="bottom-start" clickable={true}>
        <div>
          <SplashHeaderImageOptions post={post}/>
        </div>
      </LWPopper>
    </div>
    <div className={classes.rightSectionBelowBottomRow}>
      <ImageCropPreview imgRef={imgRef} setCropPreview={setCropPreview} flipped={imageFlipped} />
    </div>
  </div>
}

const ImagePreviewAndCropComponent = registerComponent('ImagePreviewAndCrop', ImagePreviewAndCrop);

declare global {
  interface ComponentTypes {
    ImagePreviewAndCrop: typeof ImagePreviewAndCropComponent
  }
}
