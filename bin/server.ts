import { serve } from "@hono/node-server";
import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import * as v from "valibot";
import { createStore } from "../lib/db";
import type { Store } from "../lib/db/types";
import { baseLogger } from "../lib/logger";
import * as deleteItem from "../lib/operations/deleteItem";
import * as getItem from "../lib/operations/getItem";
import * as putItem from "../lib/operations/putItem";

const logger = baseLogger.extend("server");
const app = new Hono();

const validApis = ["DynamoDB_20111205", "DynamoDB_20120810"] as const;
const validOperations = [
	"PutItem",
	"GetItem",
	// "UpdateItem",
	"DeleteItem",
	// "Query",
	// "Scan",
	// "BatchGetItem",
	// "BatchWriteItem",

	// "CreateTable",
	// "DeleteTable",
	// "DescribeTable",
	// "UpdateTable",
	// "ListTables",

	// "TagResource",
	// "UntagResource",
	// "ListTagsOfResource",
	// "DescribeTimeToLive",
] as const;
const operations = {
	PutItem: putItem,
	GetItem: getItem,
	// UpdateItem: {},
	DeleteItem: deleteItem,
	// Query: {},
	// Scan: {},
	// BatchGetItem: {},
	// BatchWriteItem: {},

	// CreateTable: {},
	// DescribeTable: {},
	// UpdateTable: {},
	// DeleteTable: {},
	// ListTables: {},

	// TagResource: {},
	// UntagResource: {},
	// ListTagsOfResource: {},
	// DescribeTimeToLive: {},
};

const headerSchema = v.object({
	"x-amz-target": v.pipe(
		v.string(),
		v.transform((input) => input.split(".")),
		v.strictTuple([v.picklist(validApis), v.picklist(validOperations)]),
	),
	authorization: v.optional(v.string()),
});
const querySchema = v.object({
	"X-Amz-Algorithm": v.optional(v.string()),
});
const jsonSchema = v.object({});

const store = createStore();

app.post(
	"/",
	vValidator("header", headerSchema),
	vValidator("query", querySchema),
	vValidator("json", jsonSchema),
	async (c) => {
		logger("url", c.req.url);
		logger("path", c.req.path);
		logger("query", c.req.query());
		logger("method", c.req.method);
		logger("headers", c.req.header());
		logger("body", await c.req.json());

		const {
			"x-amz-target": [_, operationName],
		} = c.req.valid("header");
		const json = await c.req.json();

		const operation = operations[operationName];

		return operation.execute(json, store).then(
			(data) => {
				logger({ data });
				return c.text(data);
			},
			(err) => {
				logger({ err });
				return c.text(err.message, 400);
			},
		);
	},
);

serve(app);
