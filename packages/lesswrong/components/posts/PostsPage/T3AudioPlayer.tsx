import React, { useRef } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useTracking } from "../../../lib/analyticsEvents";
import classNames from 'classnames';
import { useEventListener } from '../../hooks/useEventListener';
import { isEAForum } from '@/lib/instanceSettings';
import { useExternalScript } from '@/components/hooks/useExternalScript';

const styles = (theme: ThemeType) => ({
  embeddedPlayer: {
    marginBottom: "30px"
  },
  hideEmbeddedPlayer: {
    display: "none"
  }
});

/* The embedded player for posts with audio auto generated by Type 3. Note: Type 3 apply some
   custom styling on prod so this may look different locally */
export const T3AudioPlayer = ({classes, showEmbeddedPlayer, postId}: {
  showEmbeddedPlayer: boolean,
  classes: ClassesType<typeof styles>,
  postId: string
}) => {
  const mouseOverDiv = useRef(false);
  const divRef = useRef<HTMLDivElement | null>(null);
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const setMouseOverDiv = (isMouseOver: boolean) => {
    mouseOverDiv.current = isMouseOver;
  };

  // (Note: this was copied from PostsPodcastPlayer)
  // Dumb hack to let us figure out when the iframe inside the div was clicked on, as a (fuzzy) proxy for people clicking the play button
  // Inspiration: https://gist.github.com/jaydson/1780598
  // This won't trigger more than once per page load, unless the user clicks outside the div element, which will reset it
  useEventListener('blur', (e) => {
    if (mouseOverDiv.current) {
      captureEvent('clickInsidePodcastPlayer', { postId, playerType: "t3-audio" });
    }
  });
  
  const { ready: type3scriptLoaded } = useExternalScript("https://embed.type3.audio/player.js", {
    defer: "true",
    type: "module",
    "cross-origin": "anonymous",
  });

  return <div
    ref={divRef}
    onMouseOver={() => setMouseOverDiv(true)}
    onMouseOut={() => setMouseOverDiv(false)}
  >
    <div className={classNames(classes.embeddedPlayer, { [classes.hideEmbeddedPlayer]: !showEmbeddedPlayer })}>
      {type3scriptLoaded && (
        /* @ts-ignore */
        isEAForum ? <type-3-player analytics="custom" sticky="true" header-play-buttons="true" title=""></type-3-player> : <type-3-player sticky="true" analytics="custom"></type-3-player>
      )}
    </div>
  </div>
}

const T3AudioPlayerComponent = registerComponent('T3AudioPlayer', T3AudioPlayer, {styles});

declare global {
  interface ComponentTypes {
    T3AudioPlayer: typeof T3AudioPlayerComponent
  }
}
