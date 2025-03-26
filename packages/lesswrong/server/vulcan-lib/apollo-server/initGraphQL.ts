// Generate GraphQL-syntax schemas from resolvers &c that were set up with
// addGraphQLResolvers &c.

import { makeExecutableSchema } from 'apollo-server';
import { getAdditionalSchemas, queries, mutations, getResolvers, QueryAndDescription, MutationAndDescription } from '../../../lib/vulcan-lib/graphql';
import {
  selectorInputTemplate,
  mainTypeTemplate,
  createInputTemplate,
  createDataInputTemplate,
  updateInputTemplate,
  updateDataInputTemplate,
  orderByInputTemplate,
  selectorUniqueInputTemplate,
  deleteInputTemplate,
  upsertInputTemplate,
  singleInputTemplate,
  multiInputTemplate,
  multiOutputTemplate,
  singleOutputTemplate,
  mutationOutputTemplate,
  singleQueryTemplate,
  multiQueryTemplate,
  createMutationTemplate,
  updateMutationTemplate,
  upsertMutationTemplate,
  deleteMutationTemplate,
} from './graphqlTemplates';
import type { GraphQLScalarType, GraphQLSchema } from 'graphql';
import { accessFilterMultiple, accessFilterSingle } from '../../../lib/utils/schemaUtils';
import { userCanReadField } from '../../../lib/vulcan-users/permissions';
import { getSchema } from '@/lib/schema/allSchemas';
import deepmerge from 'deepmerge';
import GraphQLJSON from 'graphql-type-json';
import GraphQLDate from './graphql-date';
import * as _ from 'underscore';
import { pluralize } from "../../../lib/vulcan-lib/pluralize";
import { camelCaseify, camelToSpaces } from "../../../lib/vulcan-lib/utils";
import { getAllCollections } from "../../collections/allCollections";
import { typeNameToCollectionName } from '@/lib/generated/collectionTypeNames';

const queriesToGraphQL = (queries: QueryAndDescription[]): string =>
  `type Query {
${queries.map(q =>
        `${
          q.description
            ? `  # ${q.description}\n`
            : ''
        }  ${q.query}
  `
    )
    .join('\n')}
}

`;
const mutationsToGraphQL = (mutations: MutationAndDescription[]): string =>
  mutations.length > 0
    ? `
${
        mutations.length > 0
          ? `type Mutation {

${mutations
              .map(m => `${
                m.description
                  ? `  # ${m.description}\n`
                  : ''
              }  ${m.mutation}\n`)
              .join('\n')}
}
`
          : ''
      }

`
    : '';

// generate GraphQL schemas for all registered collections
const getTypeDefs = () => {
  const schemaContents: Array<string> = [
    "scalar JSON",
    "scalar Date",
    getAdditionalSchemas(),
  ];
  
  const allQueries = [...queries];
  const allMutations = [...mutations];
  const allResolvers: Array<any> = [];
  
  for (let collection of getAllCollections()) {
    const { schema, addedQueries, addedResolvers, addedMutations } = generateSchema(collection);

    for (let query of addedQueries) allQueries.push(query);
    for (let resolver of addedResolvers) allResolvers.push(resolver);
    for (let mutation of addedMutations) allMutations.push(mutation);
    
    schemaContents.push(schema);
  }
  
  schemaContents.push(queriesToGraphQL(allQueries));
  schemaContents.push(mutationsToGraphQL(allMutations));
  
  return {
    schemaText: schemaContents.join("\n"),
    addedResolvers: allResolvers,
  };
}

// get GraphQL type for a given field
const getGraphQLType = <N extends CollectionNameString>(
  graphql: GraphQLFieldSpecification<N>,
  isInput = false,
) => {
  if (isInput && 'inputType' in graphql && graphql.inputType) {
    return graphql.inputType;
  }

  return graphql.outputType;
};

/**
 * Get the data needed to apply an access filter based on a graphql resolver
 * return type.
 */
const getSqlResolverPermissionsData = (type: string|GraphQLScalarType) => {
  // We only have access filters for return types that correspond to a collection.
  if (typeof type !== "string") {
    return null;
  }

  // We need to use a multi access filter for arrays, or a single access filter
  // otherwise. We only apply the automatic filter for single dimensional arrays.
  const isArray = type.indexOf("[") === 0 && type.lastIndexOf("[") === 0;

  // Remove all "!"s (denoting nullability) and any array brackets to leave behind
  // a type name string.
  const nullableScalarType = type.replace(/[![\]]+/g, "");

  try {
    // Get the collection corresponding to the type name string.
    const collectionName = nullableScalarType in typeNameToCollectionName
      ? typeNameToCollectionName[nullableScalarType as keyof typeof typeNameToCollectionName]
      : null;

    return collectionName ? {collectionName, isArray} : null;
  } catch (_e) {
    return null;
  }
}

export type SchemaGraphQLFieldArgument = {name: string, type: string|GraphQLScalarType|null}
export type SchemaGraphQLFieldDescription = {
  description?: string
  name: string
  args?: SchemaGraphQLFieldArgument[]|string|null|undefined
  type: string|GraphQLScalarType|null
  directive?: string
  required?: boolean
};

type SchemaGraphQLFields = {
  mainType: SchemaGraphQLFieldDescription[],
  create: SchemaGraphQLFieldDescription[],
  update: SchemaGraphQLFieldDescription[],
  selector: SchemaGraphQLFieldDescription[],
  selectorUnique: SchemaGraphQLFieldDescription[],
  orderBy: SchemaGraphQLFieldDescription[],
}

// for a given schema, return main type fields, selector fields,
// unique selector fields, orderBy fields, creatable fields, and updatable fields
const getFields = <N extends CollectionNameString>(schema: NewSchemaType<N>, typeName: string): {
  fields: SchemaGraphQLFields
  resolvers: any
}=> {
  const fields: SchemaGraphQLFields = {
    mainType: [],
    create: [],
    update: [],
    selector: [],
    selectorUnique: [],
    orderBy: [],
  };
  const addedResolvers: Array<any> = [];

  Object.keys(schema).forEach(fieldName => {
    const field = schema[fieldName];
    const { graphql } = field;
    // only include fields that are viewable/insertable/editable
    if (!graphql || (!(graphql.canRead.length || graphql.canCreate?.length || graphql.canUpdate?.length) && !graphql.forceIncludeInExecutableSchema)) {
      return;
    }

    const fieldType = getGraphQLType(graphql);
    const inputFieldType = getGraphQLType(graphql, true);

    const fieldDirective = '';
    const fieldArguments: Array<any> = [];

    // if field has a resolveAs, push it to schema
    if (graphql.resolver) {
      const resolverName = fieldName;

      // first push its type definition
      // include arguments if there are any
      fields.mainType.push({
        description: '',
        name: resolverName,
        args: graphql.arguments,
        type: fieldType,
      });

      const permissionData = getSqlResolverPermissionsData(fieldType);

      // then build actual resolver object and pass it to addGraphQLResolvers
      const resolver = {
        [typeName]: {
          [resolverName]: (document: ObjectsByCollectionName[N], args: any, context: ResolverContext) => {
            // Check that current user has permission to access the original
            // non-resolved field.
            if (!userCanReadField(context.currentUser, graphql.canRead, document)) {
              return null;
            }

            // First, check if the value was already fetched by a SQL resolver.
            // A field with a SQL resolver that returns no value (for instance,
            // if it uses a LEFT JOIN and no matching object is found) can be
            // distinguished from a field with no SQL resolver as the former
            // will be `null` and the latter will be `undefined`.
            if (graphql.sqlResolver) {
              const typedName = resolverName as keyof ObjectsByCollectionName[N];
              let existingValue = document[typedName];
              if (existingValue !== undefined) {
                const {sqlPostProcess} = graphql;
                if (sqlPostProcess) {
                  existingValue = sqlPostProcess(existingValue, document, context);
                }
                if (permissionData) {
                  const filter = permissionData.isArray
                    ? accessFilterMultiple
                    : accessFilterSingle;
                  return filter(
                    context.currentUser,
                    permissionData.collectionName,
                    existingValue as AnyBecauseHard,
                    context,
                  );
                }
                return existingValue;
              }
            }

            // If the value wasn't supplied by a SQL resolver then we need
            // to run the code resolver instead.
            return graphql.resolver!(document, args, context);
          },
        },
      };

      addedResolvers.push(resolver);
    } else {
      // try to guess GraphQL type
      if (fieldType) {
        fields.mainType.push({
          description: '',
          name: fieldName,
          args: fieldArguments,
          type: fieldType,
          directive: fieldDirective,
        });
      }
    }

    const createFieldType = inputFieldType === 'Revision'
      ? 'JSON'
      : inputFieldType;

    // Fields should not be required for updates
    const updateFieldType = (typeof createFieldType === 'string' && createFieldType.endsWith('!'))
      ? createFieldType.slice(0, -1)
      : createFieldType;

    // OpenCRUD backwards compatibility
    if (graphql.canCreate?.length) {
      fields.create.push({
        name: fieldName,
        type: createFieldType,
      });
    }
    // OpenCRUD backwards compatibility
    if (graphql.canUpdate?.length) {
      fields.update.push({
        name: fieldName,
        type: updateFieldType,
      });
    }
  });
  return { fields, resolvers: addedResolvers };
};

// generate a GraphQL schema corresponding to a given collection
const generateSchema = (collection: CollectionBase<CollectionNameString>) => {
  let graphQLSchema = '';

  const schemaFragments: Array<string> = [];

  const collectionName = collection.collectionName;

  const typeName = collection.typeName
    ? collection.typeName
    : camelToSpaces(_.initial(collectionName).join('')); // default to posts -> Post

  const schema = getSchema(collectionName);

  const { fields, resolvers: fieldResolvers } = getFields(schema, typeName);

  const { interfaces = [], resolvers, mutations } = collection.options;

  const description = collection.options.description
    ? collection.options.description
    : `Type for ${collectionName}`;

  const { mainType, create, update, selector, selectorUnique, orderBy } = fields;

  let addedQueries: Array<any> = [];
  let addedResolvers: Array<any> = [...fieldResolvers];
  let addedMutations: Array<any> = [];

  if (mainType.length) {
    schemaFragments.push(
      mainTypeTemplate({ typeName, description, interfaces, fields: mainType })
    );
    schemaFragments.push(deleteInputTemplate({ typeName }));
    schemaFragments.push(singleInputTemplate({ typeName }));
    schemaFragments.push(multiInputTemplate({ typeName }));
    schemaFragments.push(singleOutputTemplate({ typeName }));
    schemaFragments.push(multiOutputTemplate({ typeName }));
    schemaFragments.push(mutationOutputTemplate({ typeName }));

    if (create.length) {
      schemaFragments.push(createInputTemplate({ typeName }));
      schemaFragments.push(createDataInputTemplate({ typeName, fields: create }));
    }

    if (update.length) {
      schemaFragments.push(updateInputTemplate({ typeName }));
      schemaFragments.push(upsertInputTemplate({ typeName }));
      schemaFragments.push(updateDataInputTemplate({ typeName, fields: update }));
    }

    schemaFragments.push( selectorInputTemplate({ typeName, fields: selector }));

    schemaFragments.push(selectorUniqueInputTemplate({ typeName, fields: selectorUnique }));

    schemaFragments.push(orderByInputTemplate({ typeName, fields: orderBy }));

    if (!_.isEmpty(resolvers)) {
      const queryResolvers: Partial<Record<string,any>> = {};

      // single
      if (resolvers.single) {
        addedQueries.push({query: singleQueryTemplate({ typeName }), description: resolvers.single.description});
        queryResolvers[camelCaseify(typeName)] = resolvers.single.resolver.bind(
          resolvers.single
        );
      }

      // multi
      if (resolvers.multi) {
        addedQueries.push({query: multiQueryTemplate({ typeName }), description: resolvers.multi.description});
        queryResolvers[
          camelCaseify(pluralize(typeName))
        ] = resolvers.multi.resolver.bind(resolvers.multi);
      }
      addedResolvers.push({ Query: { ...queryResolvers } });
    }

    if (mutations && !_.isEmpty(mutations)) {
      const mutationResolvers: Partial<Record<string,any>> = {};
      // create
      if (mutations.create) {
        // e.g. "createMovie(input: CreateMovieInput) : Movie"
        if (create.length === 0) {
          // eslint-disable-next-line no-console
          console.log(
            `// Warning: you defined a "create" mutation for collection ${collectionName}, but it doesn't have any mutable fields, so no corresponding mutation types can be generated. Remove the "create" mutation or define a "canCreate" property on a field to disable this warning`
          );
        } else {
          addedMutations.push({mutation: createMutationTemplate({ typeName }), description: mutations.create.description});
          mutationResolvers[`create${typeName}`] = mutations.create.mutation.bind(
            mutations.create
          );
        }
      }
      // update
      if (mutations.update) {
        // e.g. "updateMovie(input: UpdateMovieInput) : Movie"
        if (update.length === 0) {
          // eslint-disable-next-line no-console
          console.log(
            `// Warning: you defined an "update" mutation for collection ${collectionName}, but it doesn't have any mutable fields, so no corresponding mutation types can be generated. Remove the "update" mutation or define a "canUpdate" property on a field to disable this warning`
          );
        } else {
          addedMutations.push({mutation: updateMutationTemplate({ typeName }), description: mutations.update.description});
          mutationResolvers[`update${typeName}`] = mutations.update.mutation.bind(
            mutations.update
          );
        }
      }
      // upsert
      if (mutations.upsert) {
        // e.g. "upsertMovie(input: UpsertMovieInput) : Movie"
        if (update.length === 0) {
          // eslint-disable-next-line no-console
          console.log(
            `// Warning: you defined an "upsert" mutation for collection ${collectionName}, but it doesn't have any mutable fields, so no corresponding mutation types can be generated. Remove the "upsert" mutation or define a "canUpdate" property on a field to disable this warning`
          );
        } else {
          addedMutations.push({mutation: upsertMutationTemplate({ typeName }), description: mutations.upsert.description});
          mutationResolvers[`upsert${typeName}`] = mutations.upsert.mutation.bind(
            mutations.upsert
          );
        }
      }
      // delete
      if (mutations.delete) {
        // e.g. "deleteMovie(input: DeleteMovieInput) : Movie"
        addedMutations.push({mutation: deleteMutationTemplate({ typeName }), description: mutations.delete.description});
        mutationResolvers[`delete${typeName}`] = mutations.delete.mutation.bind(mutations.delete);
      }
      addedResolvers.push({ Mutation: { ...mutationResolvers } });
    }
    graphQLSchema = schemaFragments.join('\n\n') + '\n\n\n';
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `Warning: collection ${collectionName} doesn't have any GraphQL-enabled fields, so no corresponding type can be generated.`
    );
  }

  return {
    schema: graphQLSchema,
    addedQueries,
    addedResolvers,
    addedMutations
  };
};



export const initGraphQL = () => {
  const { schemaText, addedResolvers } = getTypeDefs();
  
  let allResolvers = deepmerge(
    getResolvers(),
    {
      JSON: GraphQLJSON,
      Date: GraphQLDate,
    }
  );
  for (let addedResolverGroup of addedResolvers) {
    allResolvers = deepmerge(allResolvers, addedResolverGroup);
  }
  
  executableSchema = makeExecutableSchema({
    typeDefs: schemaText,
    resolvers: allResolvers,
  });

  return executableSchema;
};

let executableSchema: GraphQLSchema | null = null;
export const getExecutableSchema = () => {
  if (!executableSchema) {
    throw new Error('Warning: trying to access executable schema before it has been created by the server.');
  }
  return executableSchema;
};
