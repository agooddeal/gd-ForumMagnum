import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useMulti } from '@/lib/crud/withMulti';
import { Link, useNavigate } from '../../lib/reactRouterWrapper';
import Button from '@material-ui/core/Button';
import { tagUrlBaseSetting } from '@/lib/instanceSettings';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import { ApolloError } from '@apollo/client';

const styles = defineStyles("RedlinkTagPage", theme => ({
  title: {
    marginBottom: 16,
  },
  pingbacksList: {
    marginBottom: "32px",
  },
  createButton: {
    padding: 8,
  },
}));

interface RedLinkPingback {
  _id: string
  slug: string
  name: string
}

export const useRedLinkPingbacks = (documentId: string|undefined, excludedDocumentIds?: string[]): {
  results: RedLinkPingback[]
  loading: boolean
  error: ApolloError|undefined
} => {
  const tagPingbacks = useMulti({
    terms: {
      view: "pingbackWikiPages",
      tagId: documentId,
      excludedTagIds: excludedDocumentIds,
    },
    collectionName: "Tags",
    fragmentName: "TagBasicInfo",
    limit: 10,
    enableTotal: true,
    skip: !documentId,
  });

  const lensPingbacks = useMulti({
    terms: {
      view: "pingbackLensPages",
      documentId: documentId,
      excludedDocumentIds: excludedDocumentIds,
    },
    collectionName: "MultiDocuments",
    fragmentName: "MultiDocumentMinimumInfo",
    limit: 10,
    enableTotal: true,
    skip: !documentId,
  });

  const results: RedLinkPingback[] = [
    ...(tagPingbacks.results ?? []).map(t => ({
      _id: t._id,
      slug: t.slug,
      name: t.name,
    })),
    ...(lensPingbacks.results ?? []).map(t => ({
      _id: t._id,
      slug: t.slug,
      name: `${t.title}${t.tabTitle ? `: ${t.tabTitle}` : ""}${t.tabSubtitle ? ` – ${t.tabSubtitle}` : ""}`,
    })),
  ]

  const tagResults = (tagPingbacks.results ?? []).map(t => ({
    _id: t._id,
    slug: t.slug,
    name: t.name,
  }));

  const lensResults = (lensPingbacks.results ?? []).map(t => ({
    _id: t._id,
    slug: t.slug,
    name: `${t.title}${t.tabTitle ? `: ${t.tabTitle}` : ""}${t.tabSubtitle ? ` – ${t.tabSubtitle}` : ""}`,
  }));
    
  console.log("in useRedLinkPingbacks", {tagId: documentId, tagResults, lensResults},
  );
  

  return { 
    results,
    loading: tagPingbacks.loading || lensPingbacks.loading,
    error: tagPingbacks.error ?? lensPingbacks.error
  }
}

function capitalizeFirstLetter(s: string): string {
  return s.substring(0,1).toUpperCase() + s.substring(1);
}

export const inferRedLinkTitle = (tag: TagBasicInfo|null, slug: string|null): string|null => {
  const derivedTitle = slug && slug.split(/[_-]/).map(capitalizeFirstLetter).join(' ');
  
  return tag?.name ?? derivedTitle ?? null;
}

const RedlinkTagPage = ({tag, slug}: {
  tag: TagPageFragment|TagPageWithRevisionFragment|null
  slug?: string
}) => {
  const classes = useStyles(styles);
  const { SingleColumnSection, Typography, ContentStyles, Error404 } = Components;
  const { results: pingbacks, loading: pingbacksLoading, error: pingbacksError } = useRedLinkPingbacks(tag?._id);
  const navigate = useNavigate();
  const title = capitalizeFirstLetter(inferRedLinkTitle(tag, slug??null) ?? "Unnamed");

  const createPageUrl = `/${tagUrlBaseSetting.get()}/create?name=${encodeURIComponent(title)}&type=wiki`
  function createPage() {
    navigate(createPageUrl);
  }


  const tagSlug = tag?.slug ?? slug;
  // If the tag doesn't have a slug, and the slug is not provided, show a 404
  if (!tagSlug) {
    return <Error404 />
  }

  return <SingleColumnSection>
    <Typography variant="display3">
      <Link className={classes.title} to={tagGetUrl({slug: tagSlug})}>{title}</Link>
    </Typography>

    <ContentStyles contentType="tag">
      <p>This wiki page has not been created yet.</p>
      
      {pingbacks && <>
        <p>These wiki pages link to this page:</p>
        
        <ul className={classes.pingbacksList}>
          {pingbacks?.map(t => <li key={t._id}>
            <Link to={tagGetUrl({slug: t.slug})}>{t.name}</Link>
          </li>)}
        </ul>
      </>}
      {!pingbacks?.length && !pingbacksLoading && !pingbacksError && <p>
        There are no wiki pages linking to this page.
      </p>}
    </ContentStyles>
    
    <Link to={createPageUrl}>
      <Button className={classes.createButton} variant="contained" color="primary">
        Create Page
      </Button>
    </Link>
  </SingleColumnSection>
}

const RedlinkTagPageComponent = registerComponent('RedlinkTagPage', RedlinkTagPage);

declare global {
  interface ComponentTypes {
    RedlinkTagPage: typeof RedlinkTagPageComponent
  }
}

