import merge from 'lodash/merge';
import { useMulti, UseMultiOptions } from '../../lib/crud/withMulti';
import { gql, useQuery } from '@apollo/client';
import { fragmentTextForQuery } from '@/lib/vulcan-lib';
import { isLW } from '@/lib/instanceSettings';

export const useTagBySlug = <FragmentTypeName extends keyof FragmentTypes>(
  slug: string,
  fragmentName: FragmentTypeName,
  queryOptions?: Partial<UseMultiOptions<FragmentTypeName, "Tags">>
): {
  tag: FragmentTypes[FragmentTypeName]|null,
  loading: boolean,
  error: any
} => {
  const { results, loading, error } = useMulti<FragmentTypeName, "Tags">({
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
    };
  } else {
    return {
      tag: null,
      loading, error
    };
  }
}

type TagPreviewFragmentName = 'TagPreviewFragment' | 'TagSectionPreviewFragment';

export const useTagPreview = <T extends string | undefined>(
  slug: string,
  hash?: T,
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

  const query = gql`
    query TagPreview($slug: String!, $hash: String) {
      TagPreview(slug: $slug, hash: $hash) {
        tag {
          ...${fragmentName}
        }
        summaries {
          ...MultiDocumentEdit
        }
      }
    }
    ${fragmentTextForQuery(fragmentName)}
    ${fragmentTextForQuery('MultiDocumentEdit')}
  `;

  const { data, loading: queryLoading, error: queryError } = useQuery(query, {
    skip: !isLW,
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
    ...queryOptions
  });

  if (isLW) {
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
