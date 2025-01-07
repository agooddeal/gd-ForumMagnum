import React, { useState } from 'react';
import classNames from 'classnames';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { ArbitalLogo } from '../icons/ArbitalLogo';
import { Link } from '@/lib/reactRouterWrapper';
import { tagGetUrl } from '@/lib/collections/tags/helpers';

const CONCEPT_ITEM_WIDTH = 300;

const ARBITAL_GREEN_DARK = "#004d40"

const styles = defineStyles("ConceptItem", (theme: ThemeType) => ({
  root: {
    maxWidth: CONCEPT_ITEM_WIDTH,
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  item: {
    cursor: "pointer",
    minHeight: 16,
    width: CONCEPT_ITEM_WIDTH,
    maxWidth: CONCEPT_ITEM_WIDTH,
    borderRadius: theme.borderRadius.default,
    padding: "2px 0px",
    paddingLeft: '2px',
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  wikiItem: {},
  titleWikiItem: {},
  leftSideItems: {
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  title: {
    fontWeight: 400,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    fontSize: 13,
    fontFamily: theme.palette.fonts.sansSerifStack,
    minWidth: 0,
    opacity: 0.95,
    marginBottom: 1,
    display: "flex",
    alignItems: "baseline",
    lineHeight: "1.4",
  },
  titleText: {
    wordBreak: "break-word",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    display: "-webkit-box",
    overflow: "ellipsis",
  },
  karma: {
    fontSize: 12,
    color: theme.palette.grey[700],
    width: 20,
    marginBottom: 0,
    textAlign: "left",
  },
  postCount: {
    fontSize: 10,
    color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    gap: "2px",
    whiteSpace: "nowrap",
    marginTop: 0,
    marginLeft: 6,
    opacity: 0.9,
  },
  postCountNumber: {
    marginTop: 0,
  },
  titleItemRoot: {
    // marginBottom: 24,
  },
  titleItem: {
    backgroundColor: "unset",
    width: '100%',
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  titleItemTitle: {
    fontWeight: 600,
    fontSize: 24,
    fontFamily: theme.palette.fonts.serifStack,
    fontVariant: "small-caps",
    whiteSpace: "nowrap",
    marginRight: 12,
  },
  titlePostCount: {
    fontSize: 12,
    color: theme.palette.grey[700],
    opacity: 0,
    transition: "opacity 0.1s ease",
  },
  children: {
    // TODO: come back to this and figure out a better way to handle it, especially for multiple screen widths
    width: "min(950px, 100vw - 16px)",
  },
  childrenContainer: {
    width: "100%",
    position: "relative",
  },
  childrenList: {
    width: "100%",
    display: "flex",
    gap: "8px",
    rowGap: "24px",
    maxWidth: (CONCEPT_ITEM_WIDTH * 4) + 36,
  },
  childrenListWrapped: {
    flexWrap: "wrap",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    width: CONCEPT_ITEM_WIDTH,
    flex: "0 0 auto",
  },
  showMoreChildren: {
    marginBottom: 8,
    marginTop: 8,
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontVariant: "normal",
    color: theme.palette.grey[600],
    fontWeight: 500,
    marginLeft: 8,
  },
  tooltipHoverPostCount: {},
  arbitalIcon: {
    height: 10,
    width: 10,
    color: ARBITAL_GREEN_DARK,
    marginLeft: 4,
    position: "relative",
  },
  arbitalGreenColor: {
    color: ARBITAL_GREEN_DARK,
  },
}));

interface ConceptItemProps {
  wikitag: AllTagsPageCacheFragment | Omit<AllTagsPageCacheFragment, "_id">;
  nestingLevel: number;
  index?: number;
  // onHover?: (wikitag: WikiTagNode | null) => void;
  // onClick?: (wikitag: WikiTagNode) => void;
  showArbitalIcon?: boolean;
}

const ConceptItem = ({
  wikitag,
  nestingLevel,
  index,
  showArbitalIcon
}: ConceptItemProps) => {
  const classes = useStyles(styles);

  const { TagsTooltip, LWTooltip } = Components;

  // Title item (for nestingLevel === 0)
  const titleItem = (
    <div className={classes.titleItem}>
      <div className={classes.leftSideItems}>
        <div className={classes.titleItemTitle}>
          <TagsTooltip
            tagSlug={wikitag.slug}
            noPrefetch
            previewPostCount={0}
            placement='right-start'
          >
            <Link to={tagGetUrl({slug: wikitag.slug})}>
              {wikitag.name}
            </Link>
          </TagsTooltip>
        </div>
        <div className={classes.titlePostCount}>{wikitag.postCount} posts</div>
      </div>
    </div>
  );

  // Regular item (for nestingLevel > 0)
  const regularItem = (
    <div
      className={classes.item}
    >
      <div className={classes.leftSideItems}>
        {/* TODO: this is a temporary score, we should use the actual baseScore from the database */}
        <div className={classes.karma}>{wikitag.baseScore}</div>
        <div className={classes.title}>
          <TagsTooltip
            tagSlug={wikitag.slug}
            noPrefetch
            previewPostCount={0}
            placement='right-start'
          >
            <span className={classNames(classes.titleText, { [classes.arbitalGreenColor]: wikitag.isArbitalImport && showArbitalIcon })}>
              <Link to={tagGetUrl({slug: wikitag.slug})}>
                {wikitag.name}
              </Link>
            </span>
          </TagsTooltip>
          {wikitag.postCount > 0 && (
            <span className={classes.postCount}>
              <TagsTooltip
                tagSlug={wikitag.slug}
                noPrefetch
                previewPostCount={8}
                hideDescription
                placement='bottom-start'
                popperClassName={classes.tooltipHoverPostCount}
              >
                (<span className={classes.postCountNumber}>{wikitag.postCount}</span>)
              </TagsTooltip>
            </span>
          )}
          {showArbitalIcon && wikitag.isArbitalImport && <LWTooltip title="This content was imported in part or entirely from Arbital.com" placement="right-start">
            <ArbitalLogo className={classes.arbitalIcon} strokeWidth={0.7} />
          </LWTooltip>}
        </div>
      </div>
    </div>
  );

  return (
    <div className={classNames(classes.root, { [classes.titleItemRoot]: nestingLevel === 0 })}>
      {nestingLevel === 0 ? titleItem : regularItem}
    </div>
  );
};

const ConceptItemComponent = registerComponent('ConceptItem', ConceptItem);

export default ConceptItemComponent;

declare global {
  interface ComponentTypes {
    ConceptItem: typeof ConceptItemComponent
  }
}
