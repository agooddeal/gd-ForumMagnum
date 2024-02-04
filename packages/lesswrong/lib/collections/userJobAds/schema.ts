import { foreignKeyField } from '../../utils/schemaUtils'
import { userOwns } from '../../vulcan-users/permissions';

const schema: SchemaType<"UserJobAds"> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    optional: false,
    nullable: false,
    hidden: true,
    canCreate: ['members'],
    canRead: [userOwns, 'admins'],
  },
  // This is just an internal name used to identify the specific job ad, such as "cltr-biosecurity-policy-advisor"
  jobName: {
    type: String,
    optional: false,
    nullable: false,
    hidden: true,
    canCreate: ['members'],
    canRead: [userOwns, 'admins'],
  },
  adState: {
    type: String,
    optional: false,
    nullable: false,
    hidden: true,
    canCreate: ['members'],
    canRead: [userOwns, 'admins'],
    canUpdate: [userOwns, 'admins'],
    allowedValues: ['seen', 'expanded', 'applied', 'reminderSet'] // TODO: split these?
  },
  lastUpdated: {
    type: Date,
    nullable: false,
    canCreate: ['members'],
    canRead: [userOwns],
    canUpdate: [userOwns],
    onUpdate: () => new Date(),
  },
};

export default schema;
