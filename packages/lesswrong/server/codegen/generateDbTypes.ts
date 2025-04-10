import { getAllCollections } from '@/server/collections/allCollections';
import { generateAllowedValuesTypeString, generatedFileHeader, isFieldNullable, simplSchemaTypeToTypescript } from './typeGenerationUtils';
import { isUniversalField } from '../../lib/utils/schemaUtils';
import { getSchema, getSimpleSchema } from '@/lib/schema/allSchemas';
import orderBy from 'lodash/orderBy';
import { isArrayTypeString, isVarcharTypeString } from '../sql/Type';
import SimpleSchema from 'simpl-schema';

const dbTypesFileHeader = generatedFileHeader+`//
// Contains Typescript signatures for database objects, generated by
// server/codegen/generateDbTypes.ts.
//
`

type GeneratedBaseTypescriptType = 'string' | 'boolean' | 'number' | 'any' | 'Date';
type GeneratedArrayTypescriptType = `Array<${GeneratedBaseTypescriptType}>`;

function databaseTypeToTypescriptType(databaseType: DatabaseBaseType | `${DatabaseBaseType}[]`): GeneratedBaseTypescriptType | GeneratedArrayTypescriptType {
  if (isArrayTypeString(databaseType)) {
    const baseTypeString = databaseType.slice(0, -2) as DatabaseBaseType;
    const convertedBaseType = databaseTypeToTypescriptType(baseTypeString);
    return `Array<${convertedBaseType}>` as GeneratedArrayTypescriptType;
  }

  if (isVarcharTypeString(databaseType)) {
    return 'string';
  }

  switch (databaseType) {
    case 'TEXT':
      return 'string';
    case 'BOOL':
      return 'boolean';
    case 'DOUBLE PRECISION':
      return 'number';
    case 'INTEGER':
      return 'number';
    case 'JSONB':
      return 'any';
    case 'TIMESTAMPTZ':
      return 'Date';
    case 'VECTOR(1536)':
      return 'Array<number>';
  }
}

function databaseSpecToTypescriptType(databaseSpec: DatabaseFieldSpecification<any>, graphqlSpec?: GraphQLFieldSpecification<any>): string {
  const { type, typescriptType } = databaseSpec;
  const nullable = isFieldNullable({ database: databaseSpec, graphql: graphqlSpec }, true);
  const nullableString = nullable ? " | null" : "";
  if (typescriptType) {
    return typescriptType + nullableString;
  }

  if (graphqlSpec?.validation?.allowedValues) {
    return generateAllowedValuesTypeString(graphqlSpec.validation.allowedValues, { database: databaseSpec, graphql: graphqlSpec });
  }

  const rawTypescriptType = databaseTypeToTypescriptType(type);

  if (rawTypescriptType === 'any') {
    return rawTypescriptType;
  }

  return rawTypescriptType + nullableString;
}

export function generateDbTypes(): string {
  const sb: Array<string> = [];
  sb.push(dbTypesFileHeader);
  for (let collection of getAllCollections()) {
    sb.push(generateCollectionType(collection));
    sb.push(generateCollectionDbType(collection));
  }
  
  sb.push(generateNameMapTypes());
  return sb.join('');
}

function generateCollectionType(collection: any): string {
  const collectionName = collection.collectionName;
  return `type ${collectionName}Collection = CollectionBase<"${collectionName}">;\n\n`;
}

function isNonTrivialSimpleSchemaType(fieldSimpleSchemaType: DerivedSimpleSchemaType<NewSchemaType<CollectionNameString>>[string]['type'], fieldSchema: NewCollectionFieldSpecification<any>): boolean {
  return (typeof fieldSimpleSchemaType.singleType !== 'function')
    || fieldSimpleSchemaType.singleType === Object
    || (fieldSimpleSchemaType.singleType === Array && !!fieldSchema.graphql?.validation?.simpleSchema)
    || fieldSimpleSchemaType.singleType instanceof SimpleSchema;
}

function generateCollectionDbType(collection: CollectionBase<any>): string {
  let sb: Array<string> = [];
  const typeName = collection.typeName;
  const schema = getSchema(collection.collectionName);
  
  sb.push(`interface Db${typeName} extends DbObject {\n`);
  sb.push(`  __collectionName?: "${collection.collectionName}"\n`);
  
  for (let fieldName of orderBy(Object.keys(schema), f=>f)) {
    const fieldSchema = schema[fieldName];

    const databaseSpec = fieldSchema.database;
    if (!databaseSpec) {
      continue;
    }

    // Universal field (therefore in base type)?
    if (isUniversalField(fieldName)) {
      continue;
    }

    let typeName: string;
    const simpleSchema = getSimpleSchema(collection.collectionName);
    const fieldSimpleSchemaType = simpleSchema._schema[fieldName]?.type;

    const isStringOrStringArrayField = databaseSpec.type.startsWith('TEXT') || databaseSpec.type.startsWith('VARCHAR');
    const hasTypescriptType = !!databaseSpec.typescriptType;
    const hasSimpleSchemaType = !!fieldSimpleSchemaType;

    const hasAllowedValues = !!fieldSchema.graphql?.validation?.allowedValues;

    const useSimpleSchemaTypeGen =
      !isStringOrStringArrayField
      && !hasTypescriptType
      && hasSimpleSchemaType
      && isNonTrivialSimpleSchemaType(fieldSimpleSchemaType, fieldSchema)
      && !hasAllowedValues;

    if (useSimpleSchemaTypeGen) {
      typeName = simplSchemaTypeToTypescript(simpleSchema._schema, fieldName, fieldSimpleSchemaType, 2, true);
    } else {
      typeName = databaseSpecToTypescriptType(databaseSpec, fieldSchema.graphql);
    }

    sb.push(`  ${fieldName}: ${typeName}\n`);
  }
  
  sb.push(`}\n\n`);
  
  return sb.join('');
}

function generateNameMapTypes(): string {
  let sb: Array<string> = [];
  sb.push('interface CollectionsByName {\n');
  for (let collection of getAllCollections()) {
    const collectionName = collection.collectionName;
    sb.push(`  ${collectionName}: ${collectionName}Collection\n`);
  }
  sb.push('}\n\n');
  
  sb.push('interface ObjectsByCollectionName {\n');
  for (let collection of getAllCollections()) {
    const {collectionName, typeName} = collection;
    sb.push(`  ${collectionName}: Db${typeName}\n`);
  }
  sb.push('}\n\n');

  sb.push('interface ObjectsByTypeName {\n');
  for (let collection of getAllCollections()) {
    const {typeName} = collection;
    sb.push(`  ${typeName}: Db${typeName}\n`);
  }
  sb.push('}\n\n');
  return sb.join('');
}
