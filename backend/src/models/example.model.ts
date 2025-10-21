/**
 * @module models/example
 * @description Example data model demonstrating the model layer pattern
 * Models define the structure of your data and can include validation logic
 * This example shows how to structure a model when using MongoDB with Mongoose
 * or can be adapted for SQL databases
 *
 * @since 2025-10-20
 * @author Template
 *
 * @features
 * - Type-safe data structures
 * - Schema definition
 * - Model methods
 * - Validation hooks
 *
 * @note
 * This is a TypeScript definition. To use with MongoDB:
 * 1. Install mongoose: npm install mongoose
 * 2. Replace this with actual Mongoose schema and model
 * 3. For SQL databases, adapt to your ORM (TypeORM, Prisma, etc.)
 */

/**
 * Example data model interface
 * Defines the structure and types for example data
 *
 * @typedef {Object} IExampleModel
 * @property {string} _id - MongoDB ObjectId (auto-generated)
 * @property {string} title - Title of the example item
 * @property {string} [description] - Optional description
 * @property {boolean} isActive - Whether the item is active
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 *
 * @example
 * const example: IExampleModel = {
 *   _id: '507f1f77bcf86cd799439011',
 *   title: 'Example Item',
 *   description: 'This is an example',
 *   isActive: true,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 */
export interface IExampleModel {
  _id?: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create input interface for creating new examples
 * Only includes required/editable fields
 *
 * @typedef {Object} ICreateExampleInput
 * @property {string} title - Title of the new item
 * @property {string} [description] - Optional description
 * @property {boolean} [isActive=true] - Whether the item is active
 *
 * @example
 * const input: ICreateExampleInput = {
 *   title: 'New Example',
 *   description: 'A new example item'
 * };
 */
export interface ICreateExampleInput {
  title: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Update input interface for updating existing examples
 * All fields are optional for partial updates
 *
 * @typedef {Object} IUpdateExampleInput
 * @property {string} [title] - Updated title
 * @property {string} [description] - Updated description
 * @property {boolean} [isActive] - Updated active status
 *
 * @example
 * const updates: IUpdateExampleInput = {
 *   title: 'Updated Title',
 *   isActive: false
 * };
 */
export interface IUpdateExampleInput {
  title?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Query options for database operations
 *
 * @typedef {Object} IQueryOptions
 * @property {number} [skip] - Number of documents to skip (pagination)
 * @property {number} [limit] - Number of documents to return
 * @property {Object} [sort] - Sorting configuration
 * @property {boolean} [lean] - Return plain JavaScript objects (Mongoose)
 */
export interface IQueryOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  lean?: boolean;
}

/**
 * MongoDB Schema Definition (using Mongoose pattern)
 * Replace with your actual Mongoose schema or adapt for SQL
 *
 * @note In a real implementation, this would be:
 * ```typescript
 * import mongoose from 'mongoose';
 *
 * const exampleSchema = new mongoose.Schema<IExampleModel>({
 *   title: {
 *     type: String,
 *     required: [true, 'Title is required'],
 *     trim: true,
 *     minlength: [3, 'Title must be at least 3 characters'],
 *   },
 *   description: {
 *     type: String,
 *     trim: true,
 *   },
 *   isActive: {
 *     type: Boolean,
 *     default: true,
 *   },
 *   createdAt: {
 *     type: Date,
 *     default: Date.now,
 *   },
 *   updatedAt: {
 *     type: Date,
 *     default: Date.now,
 *   },
 * });
 *
 * // Update the updatedAt field before saving
 * exampleSchema.pre('save', function(next) {
 *   this.updatedAt = new Date();
 *   next();
 * });
 *
 * export const ExampleModel = mongoose.model<IExampleModel>(
 *   'Example',
 *   exampleSchema
 * );
 * ```
 */

/**
 * Example of model methods that could be added
 *
 * @class ExampleModel
 * @example
 * // Custom instance method
 * exampleSchema.methods.toJSON = function() {
 *   const obj = this.toObject();
 *   delete obj.__v;
 *   return obj;
 * };
 *
 * // Custom static method
 * exampleSchema.statics.findActive = function() {
 *   return this.find({ isActive: true });
 * };
 */
