import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import moment from '../../lib/moment-timezone';
import { useCurrentUser } from '../common/withUser';
import { isAF } from '../../lib/instanceSettings';
import { voteButtonsDisabledForUser } from '../../lib/collections/users/helpers';
import type { VotingProps } from './votingProps';
import type { OverallVoteButtonProps } from './OverallVoteButton';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  overallSection: {
    display: 'inline-block',
    height: 24,
    paddingTop: 2,
    marginLeft: isFriendlyUI ? 0 : 12,
  },
  overallSectionBox: {
    marginLeft: 8,
    outline: theme.palette.border.commentBorder,
    borderRadius: isFriendlyUI ? theme.borderRadius.small : 2,
    textAlign: 'center',
    minWidth: 60
  },
  vote: {
    fontSize: 25,
    lineHeight: 0.6,
    whiteSpace: "nowrap",
    display: "inline-block"
  },
  voteScore: {
    fontSize: '1.1rem',
    margin: '0 4px',
    lineHeight: 1,
  },
  secondarySymbol: {
    fontFamily: theme.typography.body1.fontFamily,
  },
  secondaryScore: {
    fontSize: '1.1rem',
    marginLeft: 2,
    marginRight: 14
  },
  secondaryScoreNumber: {
    marginLeft: 3,
  },
  tooltipHelp: {
    fontSize: '1rem',
    fontStyle: "italic"
  },
  tooltip: {
    transform: isFriendlyUI ? "translateY(-10px)" : undefined,
  },
  verticalArrows: {
    "& .LWTooltip-root": {
      transform: "translateY(1px)",
    },
    "& $voteScore": {
      transform: "translateY(-2px)",
      display: "block",
    },
  },
})

const OverallVoteAxis = ({
  document,
  hideKarma=false,
  voteProps,
  classes,
  showBox=false,
  verticalArrows,
  className,
}: {
  document: VoteableTypeClient,
  hideKarma?: boolean,
  voteProps: VotingProps<VoteableTypeClient>,
  classes: ClassesType,
  showBox?: boolean,
  verticalArrows?: boolean,
  className?: string,
}) => {
  const currentUser = useCurrentUser();

  if (!document) return null;

  const { OverallVoteButton, LWTooltip } = Components

  const collectionName = voteProps.collectionName;
  const extendedScore = voteProps.document?.extendedScore
  const voteCount = extendedScore && ("approvalVoteCount" in extendedScore)
    ? extendedScore.approvalVoteCount
    : (voteProps.voteCount || 0);
  const karma = voteProps.baseScore;
  const {fail, reason: whyYouCantVote} = voteButtonsDisabledForUser(currentUser);
  const canVote = !fail;

  let moveToAlignnmentUserId = ""
  let documentTypeName = "comment";
  if (collectionName === "Comments") {
    const comment = document as CommentsList
    moveToAlignnmentUserId = comment.moveToAlignmentUserId
  }
  if (collectionName === "Posts") {
    documentTypeName = "post";
  }
  if (collectionName === "Revisions") {
    documentTypeName = "revision";
  }

  const af = (document as any).af;
  const afDate = (document as any).afDate;
  const afBaseScore = voteProps.document.afBaseScore;

  const moveToAfInfo = userIsAdmin(currentUser) && !!moveToAlignnmentUserId && (
    <div className={classes.tooltipHelp}>
      <span>Moved to AF by <Components.UsersName documentId={moveToAlignnmentUserId }/> on { afDate && moment(new Date(afDate)).format('YYYY-MM-DD') }</span>
    </div>
  )

  const karmaTooltipTitle = hideKarma
    ? 'This post has disabled karma visibility'
    : <div>This {documentTypeName} has {karma} <b>overall</b> karma ({voteCount} {voteCount === 1 ? "Vote" : "Votes"})</div>

  const TooltipIfDisabled = (canVote
    ? ({children}: {children: React.ReactNode}) => <>{children}</>
    : ({children}: {children: React.ReactNode}) => <LWTooltip
      placement="top"
      popperClassName={classes.tooltip}
      title={<>
        <div>{whyYouCantVote}</div>
        <div>{karmaTooltipTitle}</div>
      </>}
    >
      {children}
    </LWTooltip>
  )
  const TooltipIfEnabled = (canVote
    ? ({children, ...props}: React.ComponentProps<typeof LWTooltip>) =>
      <LWTooltip {...props} popperClassName={classes.tooltip}>
        {children}
      </LWTooltip>
    : ({children}: {children: React.ReactNode}) => <>{children}</>
  );

  const tooltipPlacement = isFriendlyUI ? "top" : "bottom";

  const buttonProps: Partial<OverallVoteButtonProps<VoteableTypeClient>> = {};
  if (verticalArrows) {
    buttonProps.solidArrow = true;
  }

  return <TooltipIfDisabled>
    <span className={classes.vote}>
      {!!af && !isAF &&
        <LWTooltip
          placement={tooltipPlacement}
          popperClassName={classes.tooltip}
          title={
            <div>
              <p>AI Alignment Forum Karma</p>
              { moveToAfInfo }
            </div>
          }
        >
          <span className={classes.secondaryScore}>
            <span className={classes.secondarySymbol}>Ω</span>
            <span className={classes.secondaryScoreNumber}>{afBaseScore || 0}</span>
          </span>
        </LWTooltip>
      }
      {!af && isAF &&
        <LWTooltip
          title="LessWrong Karma"
          placement={tooltipPlacement}
          className={classes.tooltip}
        >
          <span className={classes.secondaryScore}>
            <span className={classes.secondarySymbol}>LW</span>
            <span className={classes.secondaryScoreNumber}>{document.baseScore || 0}</span>
          </span>
        </LWTooltip>
      }
      {(!isAF || !!af) &&
        <span className={classNames(classes.overallSection, className, {
          [classes.overallSectionBox]: showBox,
          [classes.verticalArrows]: verticalArrows,
        })}>
          <TooltipIfEnabled
            title={<div><b>Overall Karma: Downvote</b><br />How much do you like this overall?<br /><em>For strong downvote, click-and-hold<br />(Click twice on mobile)</em></div>}
            placement={tooltipPlacement}
          >
            <OverallVoteButton
              orientation={verticalArrows ? "down" : "left"}
              color="error"
              upOrDown="Downvote"
              enabled={canVote}
              {...voteProps}
              {...buttonProps}
            />
          </TooltipIfEnabled>
          <TooltipIfEnabled title={karmaTooltipTitle} placement={tooltipPlacement}>
            {hideKarma
              ? <span>{' '}</span>
              : <span className={classes.voteScore}>
                  {karma}
                </span>
            }
          </TooltipIfEnabled>
          <TooltipIfEnabled
            title={<div><b>Overall Karma: Upvote</b><br />How much do you like this overall?<br /><em>For strong upvote, click-and-hold<br />(Click twice on mobile)</em></div>}
            placement={tooltipPlacement}
          >
            <OverallVoteButton
              orientation={verticalArrows ? "up" : "right"}
              color="secondary"
              upOrDown="Upvote"
              enabled={canVote}
              {...voteProps}
              {...buttonProps}
            />
          </TooltipIfEnabled>
        </span>
      }
    </span>
  </TooltipIfDisabled>
}

const OverallVoteAxisComponent = registerComponent('OverallVoteAxis', OverallVoteAxis, {styles});

declare global {
  interface ComponentTypes {
    OverallVoteAxis: typeof OverallVoteAxisComponent
  }
}
