import { pgTable, serial, text, varchar, timestamp, boolean, integer, uuid, jsonb, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  password: varchar('password', { length: 255 }).notNull(),
  image: text('image'), // User profile image URL
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Settings table
export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  // All settings stored as JSON for flexibility
  settings: jsonb('settings').default({
    notifications: {
      emailAlerts: true,
      pushNotifications: true,
      weeklyReports: true,
      campaignUpdates: true,
    },
    theme: 'light',
    // Additional settings can be added here without schema changes
  }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Roles table
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  permissions: jsonb('permissions'), // Store role permissions as JSON
  isSystem: boolean('is_system').default(false), // Flag for built-in roles
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User-Roles junction table (many-to-many relationship)
export const userRoles = pgTable('user_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  assignedBy: uuid('assigned_by').references(() => users.id),
});

// Posts table (example for social media management)
export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  platform: varchar('platform', { length: 50 }), // facebook, twitter, instagram, etc.
  image: text('image'), // Post image URL
  scheduledAt: timestamp('scheduled_at'),
  publishedAt: timestamp('published_at'),
  status: varchar('status', { length: 20 }).default('draft'), // draft, scheduled, published, failed
  metadata: jsonb('metadata'), // Store platform-specific data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages table (for CRM)
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  contactId: uuid('contact_id').references(() => contacts.id),
  subject: varchar('subject', { length: 255 }),
  content: text('content').notNull(),
  type: varchar('type', { length: 20 }), // email, sms, chat
  status: varchar('status', { length: 20 }).default('sent'), // sent, delivered, read, failed
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contacts table (for CRM)
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  company: varchar('company', { length: 255 }),
  tags: jsonb('tags'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// OAuth Applications table - stores OAuth app credentials per user
export const oauthApps = pgTable('oauth_apps', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(), // facebook, google, etc.
  clientId: text('client_id').notNull(),
  clientSecret: text('client_secret'), // Encrypted in production
  redirectUri: text('redirect_uri'),
  scopes: jsonb('scopes'), // Array of scopes
  metadata: jsonb('metadata'), // Additional platform-specific config
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Integrations table
export const integrations = pgTable('integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(), // facebook, twitter, gmail, etc.
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata'),
  isActive: boolean('is_active').default(true),
  oauthAppId: uuid('oauth_app_id').references(() => oauthApps.id), // Link to OAuth app used
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  platformPostId: varchar('platform_post_id', { length: 255 }),
  platformCommentId: varchar('platform_comment_id', { length: 255 }),
  content: text('content').notNull(),
  parentCommentId: uuid('parent_comment_id'),
  isReply: boolean('is_reply').default(false),
  status: varchar('status', { length: 20 }).default('sent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  integrationId: uuid('integration_id').references(() => integrations.id).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  platformCampaignId: varchar('platform_campaign_id', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('active'),
  spend: numeric('spend', { precision: 12, scale: 2 }).default('0'),
  clicks: integer('clicks').default(0),
  impressions: integer('impressions').default(0),
  conversions: integer('conversions').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  posts: many(posts),
  messages: many(messages),
  contacts: many(contacts),
  integrations: many(integrations),
  oauthApps: many(oauthApps),
  userRoles: many(userRoles),
  comments: many(comments),
  campaigns: many(campaigns),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [messages.contactId],
    references: [contacts.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
  oauthApp: one(oauthApps, {
    fields: [integrations.oauthAppId],
    references: [oauthApps.id],
  }),
}));

export const oauthAppsRelations = relations(oauthApps, ({ one, many }) => ({
  user: one(users, {
    fields: [oauthApps.userId],
    references: [users.id],
  }),
  integrations: many(integrations),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  integration: one(integrations, {
    fields: [campaigns.integrationId],
    references: [integrations.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
  }),
}));