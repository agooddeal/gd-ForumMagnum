import { useMulti, UseMultiOptions } from '../../lib/crud/withMulti';
import { gql, useQuery } from '@apollo/client';
import { fragmentTextForQuery } from '@/lib/vulcan-lib';
import { hasWikiLenses } from '@/lib/betas';

export const useTagBySlug = <FragmentTypeName extends keyof FragmentTypes>(
  slug: string,
  fragmentName: FragmentTypeName,
  queryOptions?: Partial<UseMultiOptions<FragmentTypeName, "Tags">>
): {
  tag: FragmentTypes[FragmentTypeName]|null,
  loading: boolean,
  error: any,
  refetch: () => Promise<void>,
} => {
  const { results, loading, error, refetch } = useMulti<FragmentTypeName, "Tags">({
    terms: {
      view: "tagBySlug",
      slug: slug
    },
    collectionName: "Tags",
    fragmentName: fragmentName,
    limit: 1,
    ...queryOptions
  });
  
  if (results && results.length>0 && (results[0] as HasIdType)._id) {
    return {
      tag: results[0] as FragmentTypes[FragmentTypeName]|null,
      loading: false,
      error: null,
      refetch,
    };
  } else {
    return {
      tag: null,
      loading, error,
      refetch,
    };
  }
}

type TagPreviewFragmentName = 'TagPreviewFragment' | 'TagSectionPreviewFragment';

export const useTagPreview = (
  slug: string,
  hash?: string,
  queryOptions?: Partial<Omit<UseMultiOptions<TagPreviewFragmentName, "Tags">, 'extraVariables' | 'extraVariablesValues'>>,
): {
  tag: (FragmentTypes[TagPreviewFragmentName] & { summaries?: MultiDocumentEdit[] }) | null,
  loading: boolean,
  error: any
} => {
  const fragmentName = hash
    ? 'TagSectionPreviewFragment'
    : 'TagPreviewFragment';

  const hashVariables = hash
    ? { extraVariables: { hash: "String" }, extraVariablesValues: { hash } } as const
    : {};

  // TODO: figure out how to use the hash in the query
  // Alternatively, assume that if we're getting a hash, we're using the hash query
  const query = gql`
    query getTagPreview($slug: String!, $hash: String) {
      TagPreview(slug: $slug, hash: $hash) {
        tag {
          ...${fragmentName}
        }
        summaries {
          ...MultiDocumentEdit
        }
      }
    }
    ${fragmentTextForQuery([fragmentName, 'MultiDocumentEdit'])}
  `;

  const { data, loading: queryLoading, error: queryError } = useQuery(query, {
    skip: queryOptions?.skip || !hasWikiLenses,
    variables: { ...hashVariables.extraVariablesValues, slug }
  })

  const { results, loading, error } = useMulti<TagPreviewFragmentName, "Tags">({
    terms: {
      view: "tagBySlug",
      slug: slug
    },
    collectionName: "Tags",
    fragmentName: fragmentName,
    limit: 1,
    ...hashVariables,
    ...queryOptions,
    skip: queryOptions?.skip || hasWikiLenses,
  });

  if (hasWikiLenses) {
    if (data?.TagPreview?.tag) {
      const tag: TagPreviewFragment & { summaries: MultiDocumentEdit[] } = { ...data.TagPreview.tag, summaries: data.TagPreview.summaries };

      return {
        tag,
        loading: false,
        error: null,
      }
    } else {
      return {
        tag: null,
        loading: queryLoading,
        error: queryError
      };
    }
  }
  
  if (results && results.length>0 && (results[0] as HasIdType)._id) {
    return {
      tag: results[0] as FragmentTypes[TagPreviewFragmentName]|null,
      loading: false,
      error: null,
    };
  } else {
    return {
      tag: null,
      loading, error
    };
  }
}
