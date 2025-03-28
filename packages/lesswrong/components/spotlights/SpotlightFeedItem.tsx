import Button from '@/lib/vendor/@material-ui/core/src/Button';
import EditIcon from '@/lib/vendor/@material-ui/icons/src/Edit';
import PublishIcon from '@/lib/vendor/@material-ui/icons/src/Publish';
import MoreVertIcon from '@/lib/vendor/@material-ui/icons/src/MoreVert';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import classNames from 'classnames';
import React, { CSSProperties, useCallback, useState } from 'react';
import { userGetProfileUrlFromSlug } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { postBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';
import { isBookUI, isFriendlyUI } from '../../themes/forumTheme';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { getSpotlightUrl } from '../../lib/collections/spotlights/helpers';
import { useUpdate } from '../../lib/crud/withUpdate';
import { usePublishAndDeDuplicateSpotlight } from './withPublishAndDeDuplicateSpotlight';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useStyles, defineStyles } from '../hooks/useStyles';
import { descriptionStyles } from './SpotlightItem';

const TEXT_WIDTH = 350;

const buildFadeMask = (breakpoints: string[]) => {
  const mask = `linear-gradient(to bottom, ${breakpoints.join(",")})`;
  return {mask, "-webkit-mask-image": mask};
}

const buildDualFadeMask = (theme: ThemeType) => {
  return buildFadeMask([
    "transparent 0%",
    `${theme.palette.text.alwaysWhite} 20%`,
    `${theme.palette.text.alwaysWhite} 80%`,
    "transparent 100%"
  ]);
}

const useSpotlightFeedItemStyles = defineStyles(
  "SpotlightFeedItem",
  (theme: ThemeType) => ({
    root: {
      background: theme.palette.panelBackground.default,
      boxShadow: theme.palette.boxShadow.default,
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 16,
      paddingRight: 16,
      maxWidth: SECTION_WIDTH,
      marginLeft: "auto",
      marginRight: "auto",
      [theme.breakpoints.up("md")]: {
        width: SECTION_WIDTH,
      },
    },
    spotlightItem: {
      position: "relative",
      borderRadius: theme.borderRadius.default,
      overflow: "hidden",
      "&:hover": {
        boxShadow: theme.palette.boxShadow.sequencesGridItemHover,
      },
    },
    contentContainer: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    },
    spotlightFadeBackground: {
      background: "var(--spotlight-fade)",
    },
    closeButtonWrapper: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
    closeButton: {
      padding: '.5em',
      minHeight: '.75em',
      minWidth: '.75em',
      color: isFriendlyUI ? theme.palette.text.alwaysWhite : theme.palette.grey[300],
      zIndex: theme.zIndexes.spotlightItemCloseButton,
    },
    hideButton: {
      cursor: "pointer",
      position: "absolute",
      top: 12,
      right: 12,
      width: 20,
      height: 20,
      color: theme.palette.text.alwaysWhite,
      "&:hover": {
        opacity: 0.8,
      },
    },
    content: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      position: "relative",
      zIndex: 2,
    },
    titleArea: {
      marginBottom: 15,
      zIndex: 3,
    },
    title: {
      ...theme.typography.postStyle,
      // fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: "1.8rem",
      fontVariant: "small-caps",
      lineHeight: "1em",
      display: "flex",
      alignItems: "center"
    },
    subtitle: {
      ...theme.typography.postStyle,
      ...theme.typography.italic,
      color: theme.palette.grey[700],
      fontSize: "1.3rem",
      marginTop: -1,
    },
    imageContainer: {
      margin: "-30px -16px -20px -16px",
      position: "relative",
      zIndex: 1,
      alignSelf: "stretch",
      display: "flex",
      justifyContent: "flex-end",
    },
    image: {
      maxWidth: "100%",
      height: "auto",
      objectFit: "cover",
      objectPosition: "right center",
      maxHeight: 250,
      borderRadius: `${theme.borderRadius.default}px 0 0 ${theme.borderRadius.default}px`,
    },
    imageDualFade: buildFadeMask([
      "transparent 5%",
      `${theme.palette.text.alwaysWhite} 25%`,
      `${theme.palette.text.alwaysWhite} 65%`,
      "rgba(255,255,255,0.5) 80%",
      "transparent 100%"
    ]),
    imageFade: buildFadeMask([
      "transparent 0",
      `${theme.palette.text.alwaysWhite} 80%`,
      `${theme.palette.text.alwaysWhite} 100%`,
    ]),
    imageFadeCustom: buildFadeMask([
      "transparent 0",
      "transparent 30%",
      `${theme.palette.text.alwaysWhite} 90%`,
      `${theme.palette.text.alwaysWhite} 100%`,
    ]),
    descriptionArea: {
      marginTop: 5,
      zIndex: 3,
      display: "flex",
      flexDirection: "column",
      gap: 8,
    },
    description: {
      ...descriptionStyles(theme),
      fontSize: "1.3rem",
      opacity: 0.9,
    },
    postPadding: {
      paddingBottom: 12
    },
    author: {
      // marginTop: 4,
      color: theme.palette.grey[600],
      marginBottom: 4,
    },
    authorName: {
      color: theme.palette.primary.main,
    },
    draftButton: {
      [theme.breakpoints.up('md')]: {
        position: "absolute",
        top: 35,
        right: -28,
      },
      [theme.breakpoints.down('sm')]: {
        position: "absolute",
        top: 33,
        right: 8
      },
    },
    deleteButton: {
      [theme.breakpoints.up('md')]: {
        position: "absolute",
        bottom: 0,
        right: -28,
      },
      [theme.breakpoints.down('sm')]: {
        position: "absolute",
        bottom: 0,
        right: 8
      },
    },
    editAllButtonIcon: {
      width: 20
    },
    metaData: {
      textAlign: "right",
      paddingTop: 6,
      paddingBottom: 12
    },
    splashImage: {
      filter: "brightness(1.2)",
    },
    splashImageContainer: {
      position: "absolute",
      top: 0,
      right: 0,
      width: "100%",
      height: "100%",
      overflow: "hidden",
      [theme.breakpoints.down('xs')]: {
        height: "100% !important",
      }
    },
    reverseIcon: {
      transform: "rotate(180deg)",
    },
    reviews: {
      width: "100%",
      maxWidth: SECTION_WIDTH,
      borderTop: theme.palette.border.extraFaint,
      background: theme.palette.panelBackground.default,
      [theme.breakpoints.down('xs')]: {
        display: "none",
      }
    },
    review: {
      '&& .CommentFrame-node': {
        border: "none",
        margin: 0,
      },
      '& .SingleLineComment-commentInfo': {
        paddingLeft: 13,
        backgroundColor: theme.palette.background.translucentBackgroundHeavy,
        borderRadius: 0
      },
      '& .CommentsItem-root': {
        borderBottom: theme.palette.border.extraFaint,
        backgroundColor: theme.palette.background.pageActiveAreaBackground,
        '&:last-child': {
          borderTop: theme.palette.border.extraFaint,
        }
      },
      '& .comments-node-root': {
        backgroundColor: 'unset',
      },
    },
    imageContainerWithAuthor: {
      marginTop: -30,
    },
  }),
  { stylePriority: -1 }
);

function getSpotlightDisplayTitle(spotlight: SpotlightDisplay): string {
  const { customTitle, post, sequence, tag } = spotlight;
  if (customTitle) return customTitle;

  if (post) return post.title;
  if (sequence) return sequence.title;
  if (tag) return tag.name;

  // We should never reach this
  return "";
}

function getSpotlightDisplayReviews(spotlight: SpotlightDisplay) {
  if (spotlight.post) {
    return spotlight.post.reviews;
  }
  return [];
}

const SpotlightFeedItem = ({
  spotlight,
  showSubtitle=true,
  className,
}: {
  spotlight: SpotlightDisplay,
  showSubtitle?: boolean,
  className?: string,
}) => {
  const classes = useStyles(useSpotlightFeedItemStyles);

  const url = getSpotlightUrl(spotlight);


  // Define fade color with a CSS variable to be accessed in the styles
  const style = {
    "--spotlight-fade": spotlight.imageFadeColor,
  } as CSSProperties;

  const {
    AnalyticsTracker, ContentItemBody, CloudinaryImage2,
    Typography, LWTooltip, ForumIcon, CommentsNode
  } = Components

  const subtitleComponent = spotlight.subtitleUrl ? <Link to={spotlight.subtitleUrl}>{spotlight.customSubtitle}</Link> : spotlight.customSubtitle

  const spotlightDocument = spotlight.post ?? spotlight.sequence ?? spotlight.tag;
  const spotlightReviews = [];//getSpotlightDisplayReviews(spotlight);


  return <AnalyticsTracker eventType="spotlightItem" captureOnMount captureOnClick={false}>
    <div
      id={spotlight._id}
      style={style}
      className={classNames(classes.root, className)}
    >
      <div className={classNames(classes.spotlightItem, {
        [classes.spotlightFadeBackground]: !!spotlight.imageFadeColor,
      })}>
        <div className={classes.contentContainer}>
          <div className={classes.content}>
            <div className={classes.titleArea}>
              <div className={classes.title}>
                <Link to={url}>
                  {getSpotlightDisplayTitle(spotlight)}
                </Link>
              </div>
              {spotlight.showAuthor && spotlightDocument?.user && 
                <Typography variant='body2' className={classes.author}>
                  by <Link className={classes.authorName} to={userGetProfileUrlFromSlug(spotlightDocument?.user.slug)}>
                    {spotlightDocument?.user.displayName}
                  </Link>
                </Typography>
              }
              {spotlight.customSubtitle && showSubtitle && 
                <div className={classes.subtitle}>
                  {subtitleComponent}
                </div>
              }
            </div>
            
            <div className={classNames(
              classes.imageContainer, 
              {[classes.imageContainerWithAuthor]: spotlight.showAuthor && spotlightDocument?.user}
            )}>
              {spotlight.spotlightSplashImageUrl && 
                <img 
                  src={spotlight.spotlightSplashImageUrl} 
                  className={classNames(classes.image, classes.imageDualFade, classes.splashImage)}
                />
              }
              {spotlight.spotlightImageId && 
                <CloudinaryImage2
                  publicId={spotlight.spotlightImageId}
                  darkPublicId={spotlight.spotlightDarkImageId}
                  className={classNames(classes.image, classes.imageDualFade)}
                  imgProps={{w: "800"}}
                  loading="lazy"
                />
              }
            </div>
            
            <div className={classes.descriptionArea}>
              {(spotlight.description?.html || isBookUI) && 
                <div className={classes.description}>
                  <ContentItemBody
                    dangerouslySetInnerHTML={{__html: spotlight.description?.html ?? ''}}
                    description={`${spotlight.documentType} ${spotlightDocument?._id}`}
                  />
                </div>
              }
              
            </div>
          </div>
        </div>
        <div className={classes.reviews}>
          {/* {spotlightReviews.map(review => <div key={review._id} className={classes.review}>
            <CommentsNode comment={review} treeOptions={{singleLineCollapse: true, forceSingleLine: true, hideSingleLineMeta: true}} nestingLevel={1}/>
          </div>)} */}
        </div>
      </div>
    </div>
  </AnalyticsTracker>
}

const SpotlightFeedItemComponent = registerComponent('SpotlightFeedItem', SpotlightFeedItem)

export default SpotlightFeedItemComponent;

declare global {
  interface ComponentTypes {
    SpotlightFeedItem: typeof SpotlightFeedItemComponent
  }
}
