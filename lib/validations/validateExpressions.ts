import * as v from "valibot";
import { attributeValueSchema } from "./attributeValueSchema";

export function validateExpressions(data: Record<string, unknown>) {
	let key: string;
	let msg: string | undefined;
	let result: string;
	const context = {
		attrNames: data.ExpressionAttributeNames,
		attrVals: data.ExpressionAttributeValues,
		unusedAttrNames: {} as Record<string, boolean>,
		unusedAttrVals: {} as Record<string, boolean>,
	};

	if (data.ExpressionAttributeNames != null) {
		if (!Object.keys(data.ExpressionAttributeNames).length)
			return "ExpressionAttributeNames must not be empty";
		for (key in data.ExpressionAttributeNames) {
			if (!/^#[0-9a-zA-Z_]+$/.test(key)) {
				return `ExpressionAttributeNames contains invalid key: Syntax error; key: "${key}"`;
			}
			context.unusedAttrNames[key] = true;
		}
	}

	// if (data.ExpressionAttributeValues != null) {
	// 	if (!Object.keys(data.ExpressionAttributeValues).length)
	// 		return "ExpressionAttributeValues must not be empty";
	// 	for (key in data.ExpressionAttributeValues) {
	// 		if (!/^:[0-9a-zA-Z_]+$/.test(key)) {
	// 			return `ExpressionAttributeValues contains invalid key: Syntax error; key: "${key}"`;
	// 		}
	// 		context.unusedAttrVals[key] = true;
	// 	}
	// 	for (key in data.ExpressionAttributeValues) {
	// 		msg = v.safeParse(
	// 			attributeValueSchema,
	// 			data.ExpressionAttributeValues[key],
	// 		).issues?.[0]?.message;
	// 		if (msg) {
	// 			return `ExpressionAttributeValues contains invalid value: ${msg} for key ${key}`;
	// 		}
	// 	}
	// }

	// if (data.UpdateExpression != null) {
	// 	result = parse(data.UpdateExpression, updateParser, context);
	// 	if (typeof result === "string") {
	// 		return `Invalid UpdateExpression: ${result}`;
	// 	}
	// 	data._updates = result;
	// }

	// if (data.ConditionExpression != null) {
	// 	result = parse(data.ConditionExpression, conditionParser, context);
	// 	if (typeof result === "string") {
	// 		return `Invalid ConditionExpression: ${result}`;
	// 	}
	// 	data._condition = result;
	// }

	// if (data.KeyConditionExpression != null) {
	// 	context.isKeyCondition = true;
	// 	result = parse(data.KeyConditionExpression, conditionParser, context);
	// 	if (typeof result === "string") {
	// 		return `Invalid KeyConditionExpression: ${result}`;
	// 	}
	// 	data._keyCondition = result;
	// }

	// if (data.FilterExpression != null) {
	// 	result = parse(data.FilterExpression, conditionParser, context);
	// 	if (typeof result === "string") {
	// 		return `Invalid FilterExpression: ${result}`;
	// 	}
	// 	data._filter = result;
	// }

	// if (data.ProjectionExpression != null) {
	// 	result = parse(data.ProjectionExpression, projectionParser, context);
	// 	if (typeof result === "string") {
	// 		return `Invalid ProjectionExpression: ${result}`;
	// 	}
	// 	data._projection = result;
	// }

	if (Object.keys(context.unusedAttrNames).length) {
		return `Value provided in ExpressionAttributeNames unused in expressions: keys: {${Object.keys(context.unusedAttrNames).join(", ")}}`;
	}

	if (Object.keys(context.unusedAttrVals).length) {
		return `Value provided in ExpressionAttributeValues unused in expressions: keys: {${Object.keys(context.unusedAttrVals).join(", ")}}`;
	}
}
