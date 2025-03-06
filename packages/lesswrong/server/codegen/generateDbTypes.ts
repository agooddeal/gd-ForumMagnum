import { getAllCollections } from '../vulcan-lib/getCollection';
import { generatedFileHeader, simplSchemaTypeToTypescript } from './typeGenerationUtils';
import { isUniversalField } from '../../lib/collectionUtils';
import { getSchema } from '../../lib/utils/getSchema';
import { isResolverOnly } from '../sql/Type';
import orderBy from 'lodash/orderBy';

const dbTypesFileHeader = generatedFileHeader+`//
// Contains Typescript signatures for database objects, generated by
// server/codegen/generateDbTypes.ts.
//
`

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

function generateCollectionDbType(collection: CollectionBase<any>): string {
  let sb: Array<string> = [];
  const typeName = collection.typeName;
  const schema = getSchema(collection);
  
  sb.push(`interface Db${typeName} extends DbObject {\n`);
  sb.push(`  __collectionName?: "${collection.collectionName}"\n`);
  
  for (let fieldName of orderBy(Object.keys(schema), f=>f)) {
    const fieldSchema = schema[fieldName];
    if (isResolverOnly(collection, fieldName, fieldSchema)) {
      continue;
    }
    // Universal field (therefore in base type)?
    if (isUniversalField(fieldName)) {
      continue;
    }
    // Subtype?
    if (fieldName.indexOf(".$") >= 0) {
      continue;
    }

    let typeName: string;
    if (schema[fieldName].typescriptType) {
      const nullable = schema[fieldName].nullable === false ? "" : " | null";
      typeName = schema[fieldName].typescriptType + nullable;
    } else {
      typeName = simplSchemaTypeToTypescript(schema, fieldName, schema[fieldName].type, 2, true);
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
