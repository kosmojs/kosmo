export type UserRegistrationResponse = {
  id: VRefine<string, { format: "uuid" }>;
  email: VRefine<string, { format: "email" }>;
  firstName: string;
  lastName: string;
  dateOfBirth: VRefine<string, { format: "date" }>;
  emailVerified: boolean;
  createdAt: Date; // Date instance (from ORM)
  updatedAt: Date; // Date instance (from ORM)
};
