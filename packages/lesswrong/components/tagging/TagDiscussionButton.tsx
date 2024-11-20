import React from "react";
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from "../../lib/reactRouterWrapper";
import CommentOutlinedIcon from "@material-ui/icons/ModeCommentOutlined";
import { useHover } from "../common/withHover";
import { useMulti } from "../../lib/crud/withMulti";
import { tagGetDiscussionUrl } from "../../lib/collections/tags/helpers";
import classNames from "classnames";

const styles = (theme: ThemeType): JssStyles => ({
  discussionButton: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    color: theme.palette.grey[700],
    display: "flex",
    alignItems: "center",
    marginLeft: "auto"
  },
  discussionButtonIcon: {
    height: 20,
    width: 20,
    marginRight: 4,
    cursor: "pointer",
    color: theme.palette.grey[700]
  },
  discussionCount: {
    [theme.breakpoints.down('sm')]: {
      alignSelf: "flex-start", //appears too low when there's no label
      marginTop: -2,
    }
  },
  discussionCountWithoutLabel: {
    alignSelf: "flex-start", //appears too low when there's no label
    marginTop: -2,
  },
  hideOnMobile: {
    marginRight: 2,
    [theme.breakpoints.down('sm')]: { //optimized or tag paye
      display: "none"
    }
  },
  hideLabel: {
    display: "none",
  }
});


const TagDiscussionButton = ({tag, text = "Discussion", hideLabel = false, hideLabelOnMobile = false, classes}: {
  tag: TagFragment | TagBasicInfo | TagCreationHistoryFragment,
  text?: string,
  hideLabel?: boolean,
  hideLabelOnMobile?: boolean,
  classes: ClassesType,
}) => {
  
  const { TagDiscussion, PopperCard } = Components
  const { hover, anchorEl, eventHandlers } = useHover()
  const { totalCount, loading } = useMulti({
    terms: {
      view: "tagDiscussionComments",
      tagId: tag._id,
      limit: 0,
    },
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    enableTotal: true,
  });

  const hideLabelClass = hideLabel ? classes.hideLabel : undefined;
  const hideLabelOnMobileClass = hideLabelOnMobile ? classes.hideOnMobile : undefined;

  const discussionCountClass = hideLabel ? classes.discussionCountWithoutLabel : classes.discussionCount;
  
  return <Link
    className={classes.discussionButton}
    to={tagGetDiscussionUrl(tag)}
    {...eventHandlers}
  >
    <CommentOutlinedIcon className={classes.discussionButtonIcon} />
    <span className={classNames(hideLabelClass, hideLabelOnMobileClass)}>{text}</span>
    {!loading && <span className={discussionCountClass}>&nbsp;{`(${totalCount || 0})`}</span>}
    <PopperCard open={hover} anchorEl={anchorEl} placement="bottom-start" >
      <TagDiscussion tag={tag}/>
    </PopperCard>
  </Link>
}

const TagDiscussionButtonComponent = registerComponent("TagDiscussionButton", TagDiscussionButton, {styles});

declare global {
  interface ComponentTypes {
    TagDiscussionButton: typeof TagDiscussionButtonComponent
  }
}
