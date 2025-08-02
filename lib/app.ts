import { randomUUID } from "node:crypto";
import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { MemoryLevel } from "memory-level";
import * as v from "valibot";
import { TableMap } from "./db/TableMap";
import { baseLogger } from "./logger";
import * as createTable from "./operations/createTable";
import * as deleteItem from "./operations/deleteItem";
import * as deleteTable from "./operations/deleteTable";
import * as describeTable from "./operations/describeTable";
import * as getItem from "./operations/getItem";
import * as listTable from "./operations/listTable";
import * as putItem from "./operations/putItem";

const validApis = ["DynamoDB_20111205", "DynamoDB_20120810"] as const;
const validOperations = [
	"CreateTable",
	"DeleteTable",
	"DescribeTable",
	// "UpdateTable",
	"ListTables",

	"PutItem",
	"GetItem",
	// "UpdateItem",
	"DeleteItem",
	// "Query",
	// "Scan",
	// "BatchGetItem",
	// "BatchWriteItem",

	// "TagResource",
	// "UntagResource",
	// "ListTagsOfResource",
	// "DescribeTimeToLive",
] as const;
const operations = {
	CreateTable: createTable,
	DeleteTable: deleteTable,
	DescribeTable: describeTable,
	// UpdateTable: {},
	ListTables: listTable,

	PutItem: putItem,
	GetItem: getItem,
	// UpdateItem: {},
	DeleteItem: deleteItem,
	// Query: {},
	// Scan: {},
	// BatchGetItem: {},
	// BatchWriteItem: {},

	// TagResource: {},
	// UntagResource: {},
	// ListTagsOfResource: {},
	// DescribeTimeToLive: {},
};

const headerSchema = v.object(
	{
		"x-amz-target": v.pipe(
			v.string(),
			v.transform((input) => input.split(".")),
			v.strictTuple([v.picklist(validApis), v.picklist(validOperations)]),
		),
		authorization: v.string(),
	},
	(issue) => {
		switch (issue.expected) {
			case '"authorization"':
				return "com.amazon.coral.service#MissingAuthenticationTokenException|Request is missing Authentication Token";
			default:
				return issue.message;
		}
	},
);
const querySchema = v.object({
	"X-Amz-Algorithm": v.optional(v.string()),
});
const jsonSchema = v.object({});

export default function createApp() {
	const logger = baseLogger.extend("server");
	const errorLogger = baseLogger.extend("error");

	const db = new MemoryLevel();
	const tableMap = new TableMap(db);

	return new Hono().post(
		"/",
		vValidator("header", headerSchema, (result, c) => {
			if (result.success) return;

			const [type, message] = result.issues[0].message.split("|");
			return c.json({ __type: type, message }, 400);
		}),
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

			c.res.headers.set("x-amzn-RequestId", randomUUID());

			try {
				const result = await operations[operationName].execute(json, tableMap);

				logger("response", { result });
				return typeof result === "string" ? c.text(result) : c.json(result);
			} catch (err) {
				logger("err", { err });

				// just type guard, expected not to be reached
				if (!(err instanceof Error)) {
					errorLogger("Unexpected error", { err });
					return c.text("Internal Server Error", 500);
				}

				////////////////////
				// handle errors

				if (err.name === "com.amazon.coral.validate#ValidationException") {
					return c.json(
						{
							__type: "com.amazon.coral.validate#ValidationException",
							message: err.message,
						},
						400,
					);
				}

				// fallback, expected not to be reached
				errorLogger("Unknown error", { err });
				return c.json(
					{ __type: "com.amazon.coral.service#SerializationException" },
					400,
				);
			}
		},
	);
}
