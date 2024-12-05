import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { tagGetRevisionLink } from '../../lib/collections/tags/helpers';
import type { TagLens } from '@/lib/arbital/useTagLenses';

const styles = (theme: ThemeType): JssStyles => ({
  username: {
    ...theme.typography.commentStyle,
    fontWeight: 600,
    fontSize: "1.16rem",
    color: theme.palette.text.normal,
    marginRight: 12
  }
});

const TagRevisionItemShortMetadata = ({tag, lens, revision, classes}: {
  tag: TagBasicInfo,
  lens?: TagLens,
  revision: RevisionMetadataWithChangeMetrics,
  classes: ClassesType,
}) => {
  const { FormatDate, UsersName, MetaInfo, LWTooltip, ChangeMetricsDisplay, SmallSideVote } = Components
  const revUrl = tagGetRevisionLink(tag, revision.version);
  
  return <>
    {lens && <div>Lens {lens.tabTitle}</div>}
    <span className={classes.username}>
      <UsersName documentId={revision.userId}/>
    </span>
    {" "}
    <Link to={revUrl}>
      <LWTooltip title="View Selected Revision"><>
        <MetaInfo>
          v{revision.version}
        </MetaInfo>
        <MetaInfo>
          <FormatDate tooltip={false} format={"MMM Do YYYY z"} date={revision.editedAt}/>{" "}
        </MetaInfo>
      </></LWTooltip>
    </Link>
    {" "}
    <MetaInfo>
      <Link to={revUrl}>
        <ChangeMetricsDisplay changeMetrics={revision.changeMetrics}/>
        {" "}
        {revision.commitMessage}
      </Link>
    </MetaInfo>
    {" "}
    <MetaInfo><SmallSideVote
      document={revision}
      collectionName="Revisions"
    /></MetaInfo>
  </>;
}

const TagRevisionItemShortMetadataComponent = registerComponent("TagRevisionItemShortMetadata", TagRevisionItemShortMetadata, {styles});

declare global {
  interface ComponentTypes {
    TagRevisionItemShortMetadata: typeof TagRevisionItemShortMetadataComponent
  }
}
