import Table from "../Table";
import Query from "../Query";
import { createCollection } from "@/lib/vulcan-lib/collections";
import { testSchema, testSchema2, testSchema3, testSchema4 } from "./testSchemas";

export type DbTestObject = {
  _id: string,
  a?: number,
  b?: string,
  c?: {
    d: {
      e: string,
    },
  },
  d?: string[],
  schemaVersion: number,
}

export const TestCollection = createCollection({
  collectionName: "TestCollection" as CollectionNameString,
  typeName: "TestCollection",
  schema: testSchema,
});

export const testTable = Table.fromCollection<CollectionNameString, DbTestObject>(TestCollection);
(TestCollection as any).getTable = () => testTable;

export type DbTestObject2 = {
  _id: string,
  data?: number,
  schemaVersion: number,
}

export const TestCollection2 = createCollection({
  collectionName: "TestCollection2" as CollectionNameString,
  typeName: "TestCollection2",
  schema: testSchema2,
});

export const testTable2 = Table.fromCollection<CollectionNameString, DbTestObject2>(TestCollection2);
(TestCollection2 as any).getTable = () => testTable2;

export type DbTestObject3 = {
  _id: string,
  notNullData: string,
  schemaVersion: number
};

export const TestCollection3 = createCollection({
  collectionName: "TestCollection3" as CollectionNameString,
  typeName: "TestCollection3",
  schema: testSchema3,
});

export const testTable3 = Table.fromCollection<CollectionNameString, DbTestObject3>(TestCollection3);
(TestCollection3 as any).getTable = () => testTable3;

export type DbTestObject4 = {
  _id: string,
  testCollection3Id: string,
  schemaVersion: number
};

export const TestCollection4 = createCollection({
  collectionName: "TestCollection4" as CollectionNameString,
  typeName: "TestCollection4",
  schema: testSchema4,
});

export const testTable4 = Table.fromCollection<CollectionNameString, DbTestObject4>(TestCollection4);
(TestCollection4 as any).getTable = () => testTable4;

export const testCollections = {
  TestCollection,
  TestCollection2,
  TestCollection3,
  TestCollection4,
};

export const normalizeWhitespace = (s: string) => s.trim().replace(/\s+/g, " ");

export type SuccessResult = {
  expectedSql: string,
  expectedArgs: any[],
}

export type ErrorResult = {
  expectedError: string,
}

export type TestCase = {
  name: string,
  getQuery: () => Query<DbTestObject>,
} & (SuccessResult | ErrorResult);

export const runTestCases = (tests: TestCase[]) => {
  for (const test of tests) {
    it(test.name, () => {
      if ("expectedError" in test) {
        expect(test.getQuery).toThrowError(test.expectedError);
      } else {
        const query = test.getQuery();
        const {sql, args} = query.compile();
        const normalizedSql = normalizeWhitespace(sql);
        const normalizedExpectedSql = normalizeWhitespace(test.expectedSql);
        expect(normalizedSql).toBe(normalizedExpectedSql);
        expect(args).toStrictEqual(test.expectedArgs);
      }
    });
  }
}
