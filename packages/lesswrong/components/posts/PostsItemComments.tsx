import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import classNames from 'classnames'
import CommentIcon from '@material-ui/icons/ModeComment';

const styles = (theme: ThemeType): JssStyles => ({
  commentsIconSmall: {
    width: 20,
    fontSize: 11,
    top: 4,
    height: 24,
    position: "relative",
    
    "& .MuiSvgIcon-root": {
      height: "100%",
    },
  },
  commentsIconLarge: {
    width: 48,
    height: 24,
    cursor: "pointer",
    position: "relative",
    flexShrink: 0,
    top: 2,
  },
  commentCount: {
    position:"absolute",
    right:"50%",
    top:"50%",
    marginTop:-3,
    transform:"translate(50%, -50%)",
    color:"white",
    fontVariantNumeric:"lining-nums",
    ...theme.typography.commentStyle
  },
  noUnreadComments: {
    color: "rgba(0,0,0,.22)",
  },
  unreadComments: {
    color: theme.palette.secondary.light,
  },
  newPromotedComments: {
    color: "rgb(160, 225, 165)"
  },
  commentCountIcon: {
    position:"absolute",
    right:"50%",
    top:"50%",
    transform:"translate(50%, -50%)",
    width:30,
    height:30,
  },
})

const PostsItemComments = ({ commentCount, small, onClick, unreadComments, newPromotedComments, classes }: {
  commentCount: number,
  small: boolean,
  onClick?: ()=>void,
  unreadComments: boolean,
  newPromotedComments: boolean,
  classes: ClassesType,
}) => {
  let unreadCommentsClass =  classes.noUnreadComments
  if (unreadComments) { unreadCommentsClass = classes.unreadComments }
  if (newPromotedComments) { unreadCommentsClass = classes.unreadComments }

  return (
    <div className={small ? classes.commentsIconSmall : classes.commentsIconLarge} onClick={onClick}>
      <CommentIcon className={classNames(classes.commentCountIcon, unreadCommentsClass)}/>
      <div className={classes.commentCount}>
        { commentCount }
      </div>
    </div>
  )
}

const PostsItemCommentsComponent = registerComponent('PostsItemComments', PostsItemComments, {styles});

declare global {
  interface ComponentTypes {
    PostsItemComments: typeof PostsItemCommentsComponent
  }
}

