import { getContributorsList, ContributorWithStats } from './contributorsUtil';
import { loadByIds } from '@/lib/loaders';
import { accessFilterMultiple } from '@/lib/utils/schemaUtils';
import keyBy from 'lodash/keyBy';
import orderBy from 'lodash/orderBy';
import take from 'lodash/take';

interface ContributorsFieldOptions {
  collectionName: 'Tags' | 'MultiDocuments';
  fieldName: string;
  graphQLType: string;
  arguments?: string;
}

export function contributorsField(options: ContributorsFieldOptions) {
  const { collectionName, fieldName, graphQLType, arguments: graphqlArgs } = options;

  return {
    resolveAs: {
      type: graphQLType,
      arguments: graphqlArgs || 'limit: Int, version: String',
      resolver: async (
        document: any,
        { limit, version }: { limit?: number; version?: string },
        context: ResolverContext
      ): Promise<{
        contributors: ContributorWithStats[];
        totalCount: number;
      }> => {
        const { Users } = context;

        const contributionStatsByUserId = await getContributorsList({
          document,
          collectionName,
          fieldName,
          version: version || null,
        });

        const contributorUserIds = Object.keys(contributionStatsByUserId);
        const contributorUsersUnfiltered = await loadByIds(context, 'Users', contributorUserIds);
        const contributorUsers = await accessFilterMultiple(
          context.currentUser,
          Users,
          contributorUsersUnfiltered,
          context
        );
        const usersById = keyBy(contributorUsers, u => u._id) as Record<string, Partial<DbUser>>;

        const sortedContributors = orderBy(
          contributorUserIds,
          userId => -contributionStatsByUserId[userId]!.currentAttributionCharCount
        );

        const contributorsWithStats: ContributorWithStats[] = sortedContributors.map(userId => ({
          user: usersById[userId],
          ...contributionStatsByUserId[userId]!,
        }));

        const totalCount = contributorsWithStats.length;

        const contributors = limit ? take(contributorsWithStats, limit) : contributorsWithStats;

        return {
          contributors,
          totalCount,
        };
      },
    },
  };
}
