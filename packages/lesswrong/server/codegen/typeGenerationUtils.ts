import { simplSchemaToGraphQLtype } from '../../lib/utils/schemaUtils';
import GraphQLJSON from 'graphql-type-json';
import SimpleSchema from 'simpl-schema'
import { graphqlTypeToCollectionName } from "../../lib/vulcan-lib/collections";
import { isValidCollectionName } from "@/server/collections/allCollections";

export const generatedFileHeader = `//
// GENERATED FILE
// Do not edit this file directly. Instead, start a server and run "npm run generate",
// which will cause this file to be regenerated. This file should nevertheless be
// checked in to version control.
`

export const assert = (b: boolean, message?: string) => {
  if(!b) {
    throw new Error(message || "Assertion failed");
  }
}

function maybeNullable(type: string, nullable: boolean) {
  return nullable ? `${type} | null` : type 
}

export function isFieldNullable(fieldSpec: Pick<NewCollectionFieldSpecification<any>, "database" | "graphql">, dbGenContext?: boolean) {
  const coalescedValue = fieldSpec.database?.nullable ?? fieldSpec.graphql?.validation?.optional;
  // The implicit default value of `nullable` in the context of database type codegen is `true`, so we need to explicitly rule out `false`, not `undefined`
  if (dbGenContext) {
    return coalescedValue !== false;
  }
  return !!coalescedValue;
}

function getAllowedValuesUnionTypeString(allowedValues: string[]) {
  return allowedValues?.map(v => `"${v}"`).join(' | ');
}

export function generateAllowedValuesTypeString(allowedValues: string[], fieldSchema: NewCollectionFieldSpecification<any>, dbGenContext?: boolean) {
  const unionType = getAllowedValuesUnionTypeString(allowedValues);
  const nullable = isFieldNullable(fieldSchema, dbGenContext);
  const arrayField = typeof fieldSchema.graphql?.outputType === 'string' && fieldSchema.graphql.outputType.startsWith('[');
  const fieldType = arrayField ? `Array<${unionType}>` : unionType;
  return maybeNullable(fieldType, nullable);
}

export function simplSchemaTypeToTypescript(
  schema: DerivedSimpleSchemaType<NewSchemaType<CollectionNameString>>,
  fieldName: string,
  simplSchemaType: DerivedSimpleSchemaFieldType['type'],
  indent = 2,
  DbType = false,
): string {
  let nullable = !!schema[fieldName]?.nullable;
  if (DbType) {
    nullable = schema[fieldName]?.nullable !== false
  }
  if (simplSchemaType.singleType === Array) {
    const elementFieldName = `${fieldName}.$`;
    if (!(elementFieldName in schema)) {
      throw new Error(`Field ${fieldName} has an array type but ${fieldName}.$ is not in the schema`);
    }

    const typescriptStrElementType = simplSchemaTypeToTypescript(schema, elementFieldName, schema[elementFieldName].type);
    return maybeNullable(`Array<${typescriptStrElementType}>`, nullable);
  } else if (simplSchemaType.singleType) {
    const allowedValues = simplSchemaType.definitions[0]?.allowedValues;

    if (simplSchemaType.singleType === String) {
      if (allowedValues) {
        const unionType = simplSchemaUnionTypeToTypescript(allowedValues);
        return maybeNullable(unionType, nullable);
      }
      return maybeNullable("string", nullable);
    }
    else if (simplSchemaType.singleType === Boolean) return maybeNullable("boolean", nullable);
    else if (simplSchemaType.singleType === Number) return maybeNullable("number", nullable);
    else if (simplSchemaType.singleType === Date) return maybeNullable("Date", nullable);
    else if (simplSchemaType.singleType === SimpleSchema.Integer) return maybeNullable("number", nullable);
    
    const graphQLtype = simplSchemaToGraphQLtype(simplSchemaType.singleType);
    if (graphQLtype) {
      return graphqlTypeToTypescript(graphQLtype);
    } else {
      const singleType = simplSchemaType.singleType;
      if (typeof singleType === 'object' && 'schema' in singleType) {
        const innerSchema = singleType.schema();
        if (innerSchema) {
          const objectSchema = simplSchemaObjectTypeToTypescript(innerSchema, indent);
          return maybeNullable(objectSchema, nullable);
        }
      }
      return `any /*${JSON.stringify(simplSchemaType)}*/`
    }
  } else {
    return "any";
  }
}

function simplSchemaUnionTypeToTypescript(allowedValues: string[]) {
  return allowedValues.map(allowedValue => `"${allowedValue}"`).join(" | ");
}

function simplSchemaObjectTypeToTypescript(innerSchema: AnyBecauseTodo, indent: number) {
  const indentSpaces = Array(indent + 2).fill(' ').join('');
  const fields = Object.keys(innerSchema)
    .filter((innerSchemaField) => !innerSchemaField.includes(".$")) // filter out array type definitions
    .map((innerSchemaField) => {
      const fieldTypeDef = simplSchemaTypeToTypescript(
        innerSchema,
        innerSchemaField,
        innerSchema[innerSchemaField].type,
        indent + 2
      );
      return `\n${indentSpaces}${innerSchemaField}: ${fieldTypeDef},`;
    })
    .join("");
  return `{${fields}\n${indentSpaces.slice(0, indentSpaces.length - 2)}}`;
}

export function graphqlTypeToTypescript(graphqlType: any, nonnull?: boolean): string {
  if (!graphqlType) throw new Error("Type cannot be undefined");
  if (graphqlType === GraphQLJSON) return "any";
  
  if (graphqlType.endsWith("!")) {
    return graphqlTypeToTypescript(graphqlType.substr(0, graphqlType.length-1), true);
  }
  
  if (graphqlType.startsWith("[") && graphqlType.endsWith("]")) {
    const arrayElementType = graphqlType.substr(1,graphqlType.length-2);
    return `Array<${graphqlTypeToTypescript(arrayElementType, false)}>`;
  }

  const nullabilitySuffix = nonnull ? "" : "|null";
  
  switch(graphqlType) {
    case "Int": return "number"+nullabilitySuffix;
    case "Boolean": return "boolean"+nullabilitySuffix;
    case "String": return "string"+nullabilitySuffix;
    case "Date": return "Date"+nullabilitySuffix;
    case "Float": return "number"+nullabilitySuffix;
    default:
      if (typeof graphqlType==="string") {
        if (graphqlType.endsWith("!") && isValidCollectionName(graphqlTypeToCollectionName(graphqlType.substr(0, graphqlType.length-1)))) {
          return graphqlType;
        } else if (isValidCollectionName(graphqlTypeToCollectionName(graphqlType))) {
          return graphqlType+nullabilitySuffix;
        }
      }
      
      if (graphqlType.collectionName) {
        return graphqlType.collectionName;
      } else {
        if (graphqlType === "JSON") {
          return "any";
        }
        // TODO
        //throw new Error("Unrecognized type: "+graphqlType);
        return `any /*${graphqlType}*/`;
      }
  }
}

/**
 * Given a multiline string with indentation, find the least-indented line and
 * remove that much indentation from every line in it. Also trim the result
 * (removing blank lines and whitespace from the top and bottom).
 */
export function autoUnindent(s: string): string {
  const lines = s.split('\n');
  
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  if (nonEmptyLines.length === 0) return '';
  
  const minIndent = nonEmptyLines.reduce((min, line) => {
    const indent = line.length - line.trimLeft().length;
    return Math.min(min, indent);
  }, Infinity);
  
  const unindentedLines = lines.map(line => {
    if (line.trim().length > 0) {
      return line.substring(minIndent);
    }
    return line;
  });
  
  return unindentedLines.join('\n').trim();
}
