import React, { useCallback, useState, useMemo, useEffect } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import classNames from "classnames";
import { DisplayFeedComment } from "./ultraFeedTypes";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useVote } from "../votes/withVote";
import { getVotingSystemByName } from "@/lib/voting/votingSystems";
import { Link } from "@/lib/reactRouterWrapper";
import { nofollowKarmaThreshold } from "../../lib/publicSettings";
import { useUltraFeedSettings } from "../../lib/ultraFeedSettings";


// Styles for the UltraFeedCommentItem component
const styles = defineStyles("UltraFeedCommentItem", (theme: ThemeType) => ({
  root: {
    paddingTop: 16,
  },
  collapsedRoot: {
    paddingTop: 16,
  },
  compressedRoot: {
    // paddingTop: 16,
  },
  collapsedFooter: {
    paddingBottom: 16,
  },
  hidden: {
    display: 'none',
  },
  commentHeader: {
    marginBottom: 8,
  },
  contentWrapper: {
    cursor: "pointer",
  },
  replyButton: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginRight: 6,
    display: "inline",
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.palette.link.dim,
    cursor: "pointer",
  },
  commentBottom: {
    marginTop: 12,
  },
  voteContainer: {
    marginLeft: 10,
  },
  numComments: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    fontSize: '1.4rem',
    opacity: 0.5,
    cursor: "pointer",
    '&:hover': {
      opacity: 1,
    },
  },
  inlineCommentThreadTitle: {
    marginTop: 12,
    marginBottom: 12,
    marginRight: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.4rem',
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.palette.link.dim,
    width: '100%',
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    fontStyle: 'italic',
  },
  inlineCommentThreadTitleAbove: {
    marginTop: 0,
    marginBottom: 12,
    marginRight: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: '1.4rem',
    fontWeight: theme.typography.body1.fontWeight,
    color: theme.palette.link.dim,
    width: '100%',
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
    fontStyle: 'italic',
  },
  inlineCommentThreadTitleLink: {
    color: theme.palette.primary.main,
  },
}));


const UltraFeedCompressedCommentsItem = ({numComments, setExpanded}: {numComments: number, setExpanded: () => void}) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.compressedRoot} onClick={setExpanded}>
      <div className={classes.numComments}>
        <span>+{numComments} comments</span>
      </div>
    </div>
  );
};

const UltraFeedCompressedCommentsItemComponent = registerComponent("UltraFeedCompressedCommentsItem", UltraFeedCompressedCommentsItem);

export interface UltraFeedCommentItemProps {
  comment: CommentsList;
  post: PostsMinimumInfo;
  displayStatus: "expanded" | "collapsed" | "hidden";
  onChangeDisplayStatus: (newStatus: "expanded" | "collapsed" | "hidden") => void;
  showInLineCommentThreadTitle?: boolean;
}

interface CollapsedPlaceholder {
  placeholder: true;
  hiddenComments: DisplayFeedComment[];
}

const UltraFeedCommentItem = ({
  comment,
  post,
  displayStatus,
  onChangeDisplayStatus,
  showInLineCommentThreadTitle,
}: UltraFeedCommentItemProps) => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking();
  const { UltraFeedCommentsItemMeta, ContentStyles, CommentBottom, FeedContentBody } = Components;
  const { settings } = useUltraFeedSettings();

  const votingSystemName = comment.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const voteProps = useVote(comment, "Comments", votingSystem);

  // Decide if we should truncate the content if collapsed
  const shouldTruncate = useMemo(() => {
    const wordCount = comment.contents?.wordCount ?? 0;
    return wordCount > 500 && displayStatus !== "expanded";
  }, [displayStatus, comment.contents?.wordCount]);

  const handleExpand = useCallback(() => {
    onChangeDisplayStatus("expanded");
    captureEvent("ultraFeedCommentExpanded");
  }, [onChangeDisplayStatus, captureEvent]);

  const expanded = displayStatus === "expanded";
  const metaDataProps = displayStatus === "expanded" ? {} : {hideDate: true, hideVoteButtons: true, hideActionsMenu: true};
  
  // Use the truncation breakpoints from settings
  const truncationBreakpoints = displayStatus === "expanded" 
    ? settings.commentTruncationBreakpoints 
    : [settings.collapsedCommentTruncation]; // Use the dedicated collapsed comment truncation setting

  // Check if line clamp should be used (only for collapsed comments)
  const shouldUseLineClamp = !expanded && settings.lineClampNumberOfLines > 0;

  // Determine if and how we should show the title
  const shouldShowInlineTitle = showInLineCommentThreadTitle && 
    (settings.commentTitleStyle === "commentReplyStyleBeneathMetaInfo" || 
     settings.commentTitleStyle === "commentReplyStyleAboveMetaInfo");
  
  const titleAboveMetaInfo = shouldShowInlineTitle && 
    settings.commentTitleStyle === "commentReplyStyleAboveMetaInfo";

  console.log("lineClamp relevant vars", {
    shouldUseLineClamp, 
    settings, 
    expanded,
    lineClampNumberOfLines: settings.lineClampNumberOfLines,
  });

  return (
    <div className={classNames(classes.root, { [classes.collapsedRoot]: !expanded })} onClick={expanded ? undefined : handleExpand}>
      {titleAboveMetaInfo && (
        <div className={classes.inlineCommentThreadTitleAbove}>
          <span>
            Replying to&nbsp;
            <Link to={`/posts/${post._id}`} className={classes.inlineCommentThreadTitleLink}>
              {post.title}
            </Link>
          </span>
        </div>
      )}
      <div className={classes.commentHeader}>
        <UltraFeedCommentsItemMeta comment={comment} post={post} {...metaDataProps} />
        {shouldShowInlineTitle && !titleAboveMetaInfo && (
          <div className={classes.inlineCommentThreadTitle}>
            <span>
              Replying to&nbsp;
              <Link to={`/posts/${post._id}`} className={classes.inlineCommentThreadTitleLink}>
                {post.title}
              </Link>
            </span>
          </div>
        )}
      </div>
      <div className={classes.contentWrapper}>
        <FeedContentBody
          comment={comment}
          html={comment.contents?.html || ""}
          breakpoints={truncationBreakpoints}
          wordCount={comment.contents?.wordCount || 0}
          linkToEntityOnFinalExpand={displayStatus === "expanded"}
          initialExpansionLevel={0}
          nofollow={(comment.user?.karma || 0) < nofollowKarmaThreshold.get()}
          clampOverride={shouldUseLineClamp ? settings.lineClampNumberOfLines : undefined}
        />
      </div>

      {expanded && <div className={classes.commentBottom}>
        <CommentBottom
          comment={comment}
          post={post}
          treeOptions={{}}
          votingSystem={votingSystem}
          voteProps={voteProps}
          replyButton={<div className={classes.replyButton}>Reply</div>}
        />
      </div>}
      {!expanded && <div className={classes.collapsedFooter}/>}
    </div>
  );

};

const UltraFeedCommentItemComponent = registerComponent("UltraFeedCommentItem", UltraFeedCommentItem);

export default UltraFeedCommentItemComponent;

declare global {
  interface ComponentTypes {
    UltraFeedCommentItem: typeof UltraFeedCommentItemComponent
    UltraFeedCompressedCommentsItem: typeof UltraFeedCompressedCommentsItemComponent
  }
}
